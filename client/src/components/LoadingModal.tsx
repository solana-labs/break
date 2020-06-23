import React from "react";
import { useClusterModal } from "providers/server";

export function LoadingModal({ show }: { show: boolean }) {
  const [cancel, setCancel] = React.useState(false);
  const [showModal, setShowModal] = useClusterModal();

  if (cancel && showModal) {
    setCancel(false);
  }

  React.useEffect(() => {
    if (!show || showModal) return;

    const timeoutId = window.setTimeout(() => {
      setCancel(true);
    }, 10000);

    return () => clearTimeout(timeoutId);
  });

  const renderContent = () => {
    if (!show || showModal) return null;
    return (
      <div className="modal-dialog modal-dialog-centered lift justify-content-center">
        <div className="modal-content w-auto">
          <div className="py-4 pl-4 pr-5">
            <div className="d-flex align-items-center justify-content-center">
              <span className="spinner-grow mr-2"></span>
              <h2 className="mb-0">{!cancel ? "Loading" : "Retrying"}...</h2>
            </div>
          </div>
          {cancel && (
            <div className="p-4 border-top-dark">
              <span onClick={() => setShowModal(true)} className="btn btn-info">
                Choose another cluster
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`modal fade${show ? " show" : ""}`}>{renderContent()}</div>
  );
}
