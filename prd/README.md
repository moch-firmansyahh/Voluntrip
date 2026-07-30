# Product Requirements Document (PRD) & Diagram Arsitektur
## Voluntrip - Aplikasi Perencanaan Trip, Rundown & Budgeting

Dokumen ini berisi **Product Requirements Document (PRD)** lengkap beserta diagram **PlantUML** (`.puml`) dan visualisasi **Mermaid** interaktif (Class Diagram, Use Case Diagram, Sequence Diagram, & Activity Diagram).

👉 **[Lihat Dokumen PRD Lengkap (PRD.md)](./PRD.md)**

---

## 📂 File Sumber PlantUML (.puml)
Seluruh file mentah PlantUML tersimpan di folder `prd/diagrams/`:
* 📐 **Class Diagram**: [`prd/diagrams/class_diagram.puml`](./diagrams/class_diagram.puml)
* 🎭 **Use Case Diagram**: [`prd/diagrams/usecase_diagram.puml`](./diagrams/usecase_diagram.puml)
* 🔄 **Sequence Diagram (Drag & Reschedule)**: [`prd/diagrams/sequence_drag_reschedule.puml`](./diagrams/sequence_drag_reschedule.puml)
* 🔐 **Sequence Diagram (Login & Auth)**: [`prd/diagrams/sequence_login.puml`](./diagrams/sequence_login.puml)
* 🔀 **Activity Diagram**: [`prd/diagrams/activity_diagram.puml`](./diagrams/activity_diagram.puml)

---

## 📊 Visualisasi Diagram Langsung (GitHub Render)

### 1. Class Diagram
```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String full_name
        +String email
    }
    class Trip {
        +UUID id
        +String name
        +String destination
        +Date start_date
        +Date end_date
        +Decimal budget_total
    }
    class RundownDay {
        +UUID id
        +Date day_date
        +Integer order_index
    }
    class RundownActivity {
        +UUID id
        +String title
        +String location
        +Time start_time
        +Time end_time
        +Double latitude
        +Double longitude
    }
    class Expense {
        +UUID id
        +Decimal amount
        +String note
    }
    class ExpenseParticipant {
        +UUID id
        +String participant_name
        +Decimal share_amount
    }

    User "1" -- "0..*" Trip : owns
    Trip "1" *-- "1..*" RundownDay : contains
    RundownDay "1" *-- "0..*" RundownActivity : contains
    Trip "1" *-- "0..*" Expense : tracks
    Expense "1" *-- "0..*" ExpenseParticipant : splits
```

### 2. Sequence Drag & Drop Auto-Reschedule
```mermaid
sequenceDiagram
    autonumber
    actor User as Traveler
    participant UI as RundownEditorClient
    participant Algo as recalculateSchedule
    participant API as API Route
    participant DB as Supabase DB

    User->>UI: Long-press 500ms pada Card Activity
    User->>UI: Drag & Drop ke posisi baru
    UI->>Algo: recalculateSchedule()
    Algo-->>UI: Waktu sekuensial baru (<= 23:59)
    UI->>API: PUT /api/rundown/reorder
    API->>DB: UPDATE order_index, start_time, end_time
    DB-->>API: Success
    API-->>UI: HTTP 200 OK
    UI-->>User: Update Timeline Seketika
```
