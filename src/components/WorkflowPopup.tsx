import WorkflowManager from "@/components/WorkflowManager";

type Props = {
  open: boolean;
  onClose: () => void;
  contractId: string;
};

export default function WorkflowPopup({ open, onClose, contractId }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-md shadow-lg border w-full max-w-[1200px] h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 flex-1 overflow-auto">
            <WorkflowManager contractId={contractId} onClose={onClose} isPopup={true} />
        </div>
      </div>
    </div>
  );
}
