import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/supabase';
import { expenseSchema } from '@/lib/validators/expense.schema';

// Helper to check expense ownership
async function checkExpenseOwnership(expenseId: string, userId: string) {
  const result = await sql`
    SELECT e.id 
    FROM expenses e
    JOIN trips t ON e.trip_id = t.id
    WHERE e.id = ${expenseId} AND t.user_id = ${userId}
  `;
  return result && result.length > 0;
}

// DELETE /api/expenses/[expenseId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;
    const isOwner = await checkExpenseOwnership(expenseId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      DELETE FROM expenses WHERE id = ${expenseId}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/expenses/[expenseId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/expenses/[expenseId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expenseId } = await params;
    const isOwner = await checkExpenseOwnership(expenseId, session.userId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Begin database transaction to update expense and reset participants
    const updatedExpense = await sql.begin(async (sql: any) => {
      // Update expense entry
      const expenses = await sql`
        UPDATE expenses SET
          category_id = ${data.category_id || null},
          amount = ${data.amount},
          note = ${data.note || null},
          expense_date = ${data.expense_date}
        WHERE id = ${expenseId}
        RETURNING *
      `;

      // Remove old participants
      await sql`
        DELETE FROM expense_participants WHERE expense_id = ${expenseId}
      `;

      // Re-insert new participants list if provided
      if (data.participants && data.participants.length > 0) {
        for (const p of data.participants) {
          await sql`
            INSERT INTO expense_participants (
              expense_id, participant_name, share_amount
            ) VALUES (
              ${expenseId}, ${p.participant_name}, ${p.share_amount}
            )
          `;
        }
      }

      return expenses[0];
    });

    return NextResponse.json(updatedExpense);
  } catch (error: any) {
    console.error('PUT /api/expenses/[expenseId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
