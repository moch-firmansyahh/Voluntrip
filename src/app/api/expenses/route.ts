import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { expenseSchema } from '@/lib/validators/expense.schema';

// Helper to check trip ownership
async function checkTripOwnership(tripId: string, userId: string) {
  const result = await sql`
    SELECT id FROM trips WHERE id = ${tripId} AND user_id = ${userId}
  `;
  return result && result.length > 0;
}

// GET /api/expenses?tripId=...
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const isOwner = await checkTripOwnership(tripId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch categories
    const categories = await sql`
      SELECT id, name FROM expense_categories WHERE trip_id = ${tripId}
    `;

    // Fetch expenses
    const expenses = await sql`
      SELECT e.id, e.trip_id, e.category_id, e.amount, e.note, e.expense_date, e.created_at, ec.name as category_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.trip_id = ${tripId}
      ORDER BY e.expense_date DESC, e.created_at DESC
    `;

    // Fetch all participants for split expenses in this trip
    const participants = await sql`
      SELECT ep.id, ep.expense_id, ep.participant_name, ep.share_amount
      FROM expense_participants ep
      JOIN expenses e ON ep.expense_id = e.id
      WHERE e.trip_id = ${tripId}
    `;

    // Combine participants with their expenses
    const expensesWithParticipants = expenses.map((expense: any) => {
      expense.participants = participants.filter((p: any) => p.expense_id === expense.id);
      // Ensure numerical type
      expense.amount = parseFloat(expense.amount);
      expense.participants.forEach((p: any) => {
        p.share_amount = parseFloat(p.share_amount);
      });
      return expense;
    });

    return NextResponse.json({
      categories,
      expenses: expensesWithParticipants,
    });
  } catch (error: any) {
    console.error('GET /api/expenses error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/expenses
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, categoryName, ...expenseData } = body;

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
    }

    const isOwner = await checkTripOwnership(tripId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = expenseSchema.safeParse(expenseData);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;
    let categoryId = data.category_id;

    // Handle custom category generation
    if (categoryName && !categoryId) {
      const trimmedName = categoryName.trim();
      const existingCategories = await sql`
        SELECT id FROM expense_categories 
        WHERE trip_id = ${tripId} AND LOWER(name) = LOWER(${trimmedName})
      `;

      if (existingCategories && existingCategories.length > 0) {
        categoryId = existingCategories[0].id;
      } else {
        const newCat = await sql`
          INSERT INTO expense_categories (trip_id, name)
          VALUES (${tripId}, ${trimmedName})
          RETURNING id
        `;
        categoryId = newCat[0].id;
      }
    }

    // Begin database transaction
    const newExpense = await sql.begin(async (sql: any) => {
      // Insert main expense
      const expenses = await sql`
        INSERT INTO expenses (
          trip_id, category_id, amount, note, expense_date
        ) VALUES (
          ${tripId}, ${categoryId || null}, ${data.amount}, ${data.note || null}, ${data.expense_date}
        ) RETURNING *
      `;
      const expense = expenses[0];

      // Insert participants if split mode and participants are provided
      if (data.participants && data.participants.length > 0) {
        for (const p of data.participants) {
          await sql`
            INSERT INTO expense_participants (
              expense_id, participant_name, share_amount
            ) VALUES (
              ${expense.id}, ${p.participant_name}, ${p.share_amount}
            )
          `;
        }
      }

      return expense;
    });

    return NextResponse.json(newExpense);
  } catch (error: any) {
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
