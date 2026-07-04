import { Inbox } from 'lucide-react'

export default function DataTable({ columns, data, renderRow, emptyMessage = 'No records found', emptyIcon: EmptyIcon }) {
  return (
    <div className="table-container">
      <table>
        <thead><tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr></thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length}>
              <div className="empty-state">
                <div className="empty-state-icon">{EmptyIcon ? <EmptyIcon size={28} /> : <Inbox size={28} />}</div>
                <h4>{emptyMessage}</h4>
                <p>Start by adding your first entry</p>
              </div>
            </td></tr>
          ) : data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  )
}
