const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  modification_requested: 'Needs Changes'
};

export default function Stamp({ status }) {
  return <span className={`stamp ${status}`}>{LABELS[status] || status}</span>;
}
