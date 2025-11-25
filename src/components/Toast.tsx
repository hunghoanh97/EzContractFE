import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose?: () => void }) {
  useEffect(() => {
    const id = setTimeout(() => onClose && onClose(), 2000);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow text-white ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {message}
    </div>
  );
}
