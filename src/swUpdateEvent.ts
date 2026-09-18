// Shared between main.tsx (dispatches, outside the React tree) and App.tsx (listens, to show a
// dismissible "new version" notice instead of reloading — and silently re-locking the vault —
// out from under someone mid-edit). Kept in one place so the two sides can never drift apart.
export const UPDATE_READY_EVENT = "finance:update-ready";
