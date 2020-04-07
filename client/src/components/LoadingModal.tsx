import React from "react";

export function LoadingModal({ show }: { show: boolean }) {
  const renderContent = () => {
    if (!show) return null;
    return (
      <div className="modal-dialog modal-dialog-centered lift justify-content-center">
        <div className="modal-content py-4 pl-4 pr-5 w-auto">
          <div className="d-flex align-items-center">
            <span className="spinner-grow mr-2"></span>
            <h2 className="mb-0">Loading...</h2>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`modal fade${show ? " show" : ""}`}>{renderContent()}</div>
  );
}
