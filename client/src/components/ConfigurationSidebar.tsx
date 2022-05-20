import { useDebounceCallback } from "@react-hook/debounce";
import { PublicKey } from "@solana/web3.js";
import { ClientConfig, useClientConfig } from "providers/config";
import { useRpcUrlState } from "providers/rpc";
import { useServerConfig } from "providers/server/http";
import React from "react";

export function ConfigurationSidebar() {
  const [clientConfig] = useClientConfig();
  return (
    <aside className="page-sidebar">
      <h3 className="m-4 font-weight-bold">Live Game Options</h3>
      <hr />
      <div className="sidebar-body">
        <ToggleAutoSendInput />
        <ProxyModeInput />
        {clientConfig.useTpu && <ToggleRetryInput />}
        <SetComputeUnitPriceInput />
        <ExtraWriteAccountInput />
      </div>
      <hr />
      <h3 className="m-4 font-weight-bold">New Game Options</h3>
      <hr />
      <div className="sidebar-body">
        <DebugModeInput />
        <ParallelizationInput />
        {!clientConfig.useTpu && <RpcEndpointInput />}
      </div>
    </aside>
  );
}

function RpcEndpointInput() {
  const configRpcUrl = useServerConfig()?.rpcUrl;
  const [rpcUrl, setRpcUrl] = useRpcUrlState();
  const [, setClientConfig] = useClientConfig();

  const onUrlInput = useDebounceCallback((url: string) => {
    if (url.length > 0) {
      try {
        new URL(url);
        setRpcUrl(url);
        setClientConfig((config) => ({ ...config, rpcUrl: url }));
      } catch (err) {
        // ignore bad url
      }
    } else if (configRpcUrl) {
      setRpcUrl(configRpcUrl);
      setClientConfig((config) => ({ ...config, rpcUrl: configRpcUrl }));
    }
  }, 500);

  const defaultValue = rpcUrl || configRpcUrl;
  return (
    <>
      <span className="me-3">RPC Endpoint</span>
      <input
        type="url"
        defaultValue={defaultValue}
        className="form-control mt-4"
        onInput={(e) => onUrlInput(e.currentTarget.value)}
      />
      <p className="text-muted font-size-sm mt-3">
        This RPC endpoint is used by the client and by the server when proxying
        transactions to the cluster.
      </p>
    </>
  );
}

function DebugModeInput() {
  const [config, setConfig] = useClientConfig();
  const onChange = (enabled: boolean) => {
    const showDebugTable = enabled;
    const countdownSeconds = enabled ? 1500 : 15;
    setConfig((config: ClientConfig) => ({
      ...config,
      showDebugTable,
      countdownSeconds,
    }));
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <span className="me-3">Enable debug mode</span>
        <div className="form-check form-switch">
          <input
            type="checkbox"
            defaultChecked={config.showDebugTable}
            className="form-check-input"
            id="debugToggle"
            onChange={(e) => onChange(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="debugToggle"></label>
        </div>
      </div>
      <p className="text-muted font-size-sm mt-3">
        Enable this setting to view a detailed table of transaction and block
        timing information.
      </p>
    </>
  );
}

function ProxyModeInput() {
  const [config, setConfig] = useClientConfig();
  const onChange = (enabled: boolean) => {
    setConfig((config: ClientConfig) => ({
      ...config,
      useTpu: enabled,
    }));
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <span className="me-3">Skip RPC Server</span>
        <div className="form-check form-switch">
          <input
            type="checkbox"
            defaultChecked={config.useTpu}
            className="form-check-input"
            id="tpuToggle"
            onChange={(e) => onChange(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="tpuToggle"></label>
        </div>
      </div>
      <p className="text-muted font-size-sm mt-3">
        Send transactions directly to the leader TPU port.
      </p>
    </>
  );
}

function ToggleRetryInput() {
  const [config, setConfig] = useClientConfig();
  const onChange = (enabled: boolean) => {
    setConfig((config: ClientConfig) => ({
      ...config,
      retryTransactionEnabled: enabled,
    }));
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <span className="me-3">Enable transaction retries</span>
        <div className="form-check form-switch">
          <input
            type="checkbox"
            defaultChecked={config.retryTransactionEnabled}
            className="form-check-input"
            id="retryToggle"
            onChange={(e) => onChange(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="retryToggle"></label>
        </div>
      </div>
      <p className="text-muted font-size-sm mt-3">
        Retry each transaction until confirmed.
      </p>
    </>
  );
}

function ToggleAutoSendInput() {
  const [config, setConfig] = useClientConfig();
  const onChange = (enabled: boolean) => {
    setConfig((config: ClientConfig) => ({
      ...config,
      autoSendTransactions: enabled,
    }));
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <span className="me-3">Auto send transactions</span>
        <div className="form-check form-switch">
          <input
            type="checkbox"
            defaultChecked={config.autoSendTransactions}
            className="form-check-input"
            id="autoSendToggle"
            onChange={(e) => onChange(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="autoSendToggle"></label>
        </div>
      </div>
      <p className="text-muted font-size-sm mt-3">
        Send one transaction per second.
      </p>
    </>
  );
}

function ParallelizationInput() {
  const [config, setConfig] = useClientConfig();
  const [error, setError] = React.useState<string>();

  const onInput = (input: string) => {
    const parallelization = Number(input);
    if (
      Number.isNaN(parallelization) ||
      Math.floor(parallelization) !== parallelization
    ) {
      setError("Input must be an integer");
    } else if (parallelization < 1 || parallelization > 10) {
      setError("Input must be in the range [1, 10]");
    } else {
      setError(undefined);
      setConfig((config: ClientConfig) => ({ ...config, parallelization }));
    }
  };

  return (
    <>
      <span className="me-3">Transaction Parallelization</span>
      <input
        type="number"
        defaultValue={config.parallelization}
        className="form-control mt-4"
        onInput={(e) => onInput(e.currentTarget.value)}
      />
      {error && <p className="text-warning font-size-sm mt-3">{error}</p>}
      <p className="text-muted font-size-sm mt-3">
        Number of transactions that can be in-flight without write-lock
        conflicts by using different fee payer and state accounts.
      </p>
    </>
  );
}

function SetComputeUnitPriceInput() {
  const [config, setConfig] = useClientConfig();
  const [error, setError] = React.useState<string>();

  const onInput = (input: string) => {
    const computeUnitPrice = Number(input);
    if (
      Number.isNaN(computeUnitPrice) ||
      Math.floor(computeUnitPrice) !== computeUnitPrice
    ) {
      setError("Price must be an integer");
    } else if (computeUnitPrice < 0 || computeUnitPrice >= Math.pow(2, 32)) {
      setError("Price must be in the range [0, 2^32)");
    } else {
      setError(undefined);
      setConfig((config: ClientConfig) => ({
        ...config,
        computeUnitPrice: computeUnitPrice,
      }));
    }
  };

  return (
    <>
      <span className="me-3">Compute Unit Price (micro-lamports)</span>
      <input
        type="number"
        defaultValue={config.computeUnitPrice}
        placeholder="1M recommended (1 lamport/cu)"
        className="form-control mt-4"
        onInput={(e) => onInput(e.currentTarget.value)}
      />
      {error && <p className="text-warning font-size-sm mt-3">{error}</p>}
      <p className="text-muted font-size-sm mt-3">
        Add a fee to increase transaction processing prioritization.
      </p>
    </>
  );
}

function ExtraWriteAccountInput() {
  const [config, setConfig] = useClientConfig();
  const [error, setError] = React.useState<string>();

  const onInput = (extraWriteAccount: string) => {
    if (extraWriteAccount.length === 0) {
      setError(undefined);
      setConfig((config: ClientConfig) => ({
        ...config,
        extraWriteAccount: undefined,
      }));
    } else {
      try {
        new PublicKey(extraWriteAccount);
        setError(undefined);
        setConfig((config: ClientConfig) => ({ ...config, extraWriteAccount }));
      } catch (err) {
        setError("Input must be a valid base58 address");
      }
    }
  };

  return (
    <>
      <span className="me-3">Extra Transaction Write Account</span>
      <input
        defaultValue={config.extraWriteAccount}
        className="form-control mt-4"
        onInput={(e) => onInput(e.currentTarget.value)}
      />
      {error && <p className="text-warning font-size-sm mt-3">{error}</p>}
      <p className="text-muted font-size-sm mt-3">
        Add an extra writable account to each transaction for debugging
        write-lock contention.
      </p>
    </>
  );
}
