"use client";
import { useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xaCe31116996B0dfb724D10154F3cdCDB97c913D1";

const ABI = [
  "function question() view returns (string)",
  "function yesVotes() view returns (uint256)",
  "function noVotes() view returns (uint256)",
  "function votingOpen() view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function castVote(bool _vote) external",
  "function endVoting() external",
  "function getResults() view returns (uint256, uint256)"
];

export default function Home() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [question, setQuestion] = useState("");
  const [yesVotes, setYesVotes] = useState(0);
  const [noVotes, setNoVotes] = useState(0);
  const [votingOpen, setVotingOpen] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (err) {
      alert("Please switch to Sepolia network in MetaMask!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const _account = await signer.getAddress();
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    setAccount(_account);
    setContract(_contract);
    await loadData(_contract, _account);
  }

  async function loadData(_contract, _account) {
    try {
      const q = await _contract.question();
      const [yes, no] = await _contract.getResults();
      const open = await _contract.votingOpen();
      const voted = await _contract.hasVoted(_account);
      setQuestion(q);
      setYesVotes(Number(yes));
      setNoVotes(Number(no));
      setVotingOpen(open);
      setHasVoted(voted);
    } catch (err) {
      setMessage("Error loading data: " + err.message);
    }
  }

  async function vote(choice) {
    if (!contract) return;
    setLoading(true);
    setMessage("");
    try {
      const tx = await contract.castVote(choice);
      setMessage("Transaction sent! Waiting...");
      await tx.wait();
      setMessage(choice ? "You voted YES!" : "You voted NO!");
      await loadData(contract, account);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setLoading(false);
  }

  async function endVoting() {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.endVoting();
      setMessage("Ending voting...");
      await tx.wait();
      setMessage("Voting has ended!");
      await loadData(contract, account);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setLoading(false);
  }

  const total = yesVotes + noVotes;
  const yesPercent = total > 0 ? Math.round((yesVotes / total) * 100) : 0;
  const noPercent = total > 0 ? Math.round((noVotes / total) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          <h1 style={styles.title}>Vote DApp</h1>
          <span style={{
            ...styles.badge,
            background: votingOpen ? "#EAF3DE" : "#FCEBEB",
            color: votingOpen ? "#3B6D11" : "#A32D2D"
          }}>
            {votingOpen ? "Voting Open" : "Voting Closed"}
          </span>
          <p style={styles.network}>Network: Sepolia Testnet</p>
        </div>

        {question ? (
          <div style={styles.questionBox}>
            <p style={styles.questionText}>{question}</p>
          </div>
        ) : null}

        {!account ? (
          <button onClick={connectWallet} style={styles.connectBtn}>
            Connect MetaMask
          </button>
        ) : (
          <p style={styles.accountText}>
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}

        {account && votingOpen && !hasVoted ? (
          <div style={styles.voteRow}>
            <button
              onClick={() => vote(true)}
              disabled={loading}
              style={{ ...styles.yesBtn, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Waiting..." : "YES"}
            </button>
            <button
              onClick={() => vote(false)}
              disabled={loading}
              style={{ ...styles.noBtn, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Waiting..." : "NO"}
            </button>
          </div>
        ) : null}

        {hasVoted ? (
          <div style={styles.votedBox}>
            <p style={styles.votedMsg}>You have already voted!</p>
          </div>
        ) : null}

        {account ? (
          <div style={styles.results}>
            <p style={styles.resultsTitle}>Live Results</p>
            <div style={styles.resultRow}>
              <span style={styles.yesLabel}>YES</span>
              <div style={styles.barBg}>
                <div style={{
                  ...styles.barFill,
                  width: yesPercent + "%",
                  background: "#1D9E75"
                }} />
              </div>
              <span style={styles.count}>{yesVotes} ({yesPercent}%)</span>
            </div>
            <div style={styles.resultRow}>
              <span style={styles.noLabel}>NO</span>
              <div style={styles.barBg}>
                <div style={{
                  ...styles.barFill,
                  width: noPercent + "%",
                  background: "#D85A30"
                }} />
              </div>
              <span style={styles.count}>{noVotes} ({noPercent}%)</span>
            </div>
            <p style={styles.totalText}>Total votes: {total}</p>
          </div>
        ) : null}

        {message ? (
          <div style={styles.messageBox}>
            <p style={styles.message}>{message}</p>
          </div>
        ) : null}

        {account && votingOpen ? (
          <button
            onClick={endVoting}
            disabled={loading}
            style={{ ...styles.endBtn, opacity: loading ? 0.6 : 1 }}
          >
            End Voting (Owner Only)
          </button>
        ) : null}

        {account ? (
          <p
            onClick={() => window.open("https://sepolia.etherscan.io/address/" + CONTRACT_ADDRESS)}
            style={styles.etherscanLink}
          >
            View on Etherscan
          </p>
        ) : null}

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #7F77DD, #D4537E)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    fontFamily: "sans-serif"
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "2rem",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#1a1a2e"
  },
  badge: {
    display: "inline-block",
    padding: "4px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "8px"
  },
  network: {
    fontSize: "12px",
    color: "#888",
    marginTop: "4px"
  },
  questionBox: {
    background: "#7F77DD22",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1.5rem",
    border: "1px solid #7F77DD44"
  },
  questionText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#534AB7",
    textAlign: "center",
    margin: 0
  },
  connectBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #7F77DD, #D4537E)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "1rem"
  },
  accountText: {
    fontSize: "13px",
    color: "#888",
    textAlign: "center",
    marginBottom: "1rem"
  },
  voteRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "1.5rem"
  },
  yesBtn: {
    flex: 1,
    padding: "16px",
    background: "#1D9E75",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer"
  },
  noBtn: {
    flex: 1,
    padding: "16px",
    background: "#D85A30",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer"
  },
  votedBox: {
    background: "#f8f4ff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "1rem",
    textAlign: "center"
  },
  votedMsg: {
    color: "#534AB7",
    fontSize: "14px",
    fontWeight: "500",
    margin: 0
  },
  results: {
    marginBottom: "1.5rem"
  },
  resultsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "12px",
    textAlign: "center"
  },
  resultRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px"
  },
  yesLabel: {
    width: "30px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1D9E75"
  },
  noLabel: {
    width: "30px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#D85A30"
  },
  barBg: {
    flex: 1,
    background: "#f0f0f0",
    borderRadius: "8px",
    height: "14px",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    borderRadius: "8px",
    transition: "width 0.5s ease"
  },
  count: {
    fontSize: "12px",
    color: "#888",
    minWidth: "75px",
    textAlign: "right"
  },
  totalText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#aaa",
    marginTop: "8px"
  },
  messageBox: {
    background: "#f8f4ff",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "1rem"
  },
  message: {
    textAlign: "center",
    fontSize: "14px",
    color: "#534AB7",
    margin: 0
  },
  endBtn: {
    width: "100%",
    padding: "12px",
    background: "white",
    color: "#D85A30",
    border: "2px solid #D85A30",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "1rem"
  },
  etherscanLink: {
    display: "block",
    textAlign: "center",
    fontSize: "13px",
    color: "#7F77DD",
    textDecoration: "underline",
    cursor: "pointer"
  }
};