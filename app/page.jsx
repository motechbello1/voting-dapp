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
      alert("Please switch to Sepolia!");
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
      setMessage("Error: " + err.message);
    }
  }

  async function vote(choice) {
    if (!contract) return;
    setLoading(true);
    setMessage("");
    try {
      const tx = await contract.castVote(choice);
      setMessage("Waiting for confirmation...");
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
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#7F77DD,#D4537E)", display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"sans-serif" }}>
      <div style={{ background:"white", borderRadius:"20px", padding:"2rem", width:"100%", maxWidth:"500px" }}>

        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <h1 style={{ fontSize:"28px", fontWeight:"700", color:"#1a1a2e" }}>Vote DApp</h1>
          <span style={{ display:"inline-block", padding:"4px 16px", borderRadius:"20px", fontSize:"13px", background: votingOpen ? "#EAF3DE" : "#FCEBEB", color: votingOpen ? "#3B6D11" : "#A32D2D" }}>
            {votingOpen ? "Voting Open" : "Voting Closed"}
          </span>
          <p style={{ fontSize:"12px", color:"#888" }}>Sepolia Testnet</p>
        </div>

        {question ? (
          <div style={{ background:"#7F77DD22", borderRadius:"12px", padding:"1rem", marginBottom:"1.5rem" }}>
            <p style={{ fontSize:"16px", color:"#534AB7", textAlign:"center", margin:0 }}>{question}</p>
          </div>
        ) : null}

        {!account ? (
          <button onClick={connectWallet} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#7F77DD,#D4537E)", color:"white", border:"none", borderRadius:"12px", fontSize:"16px", cursor:"pointer", marginBottom:"1rem" }}>
            Connect MetaMask
          </button>
        ) : (
          <p style={{ fontSize:"13px", color:"#888", textAlign:"center", marginBottom:"1rem" }}>
            Connected: {account.slice(0,6)}...{account.slice(-4)}
          </p>
        )}

        {account && votingOpen && !hasVoted ? (
          <div style={{ display:"flex", gap:"12px", marginBottom:"1.5rem" }}>
            <button onClick={() => vote(true)} disabled={loading} style={{ flex:1, padding:"16px", background:"#1D9E75", color:"white", border:"none", borderRadius:"12px", fontSize:"18px", fontWeight:"700", cursor:"pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Waiting..." : "YES"}
            </button>
            <button onClick={() => vote(false)} disabled={loading} style={{ flex:1, padding:"16px", background:"#D85A30", color:"white", border:"none", borderRadius:"12px", fontSize:"18px", fontWeight:"700", cursor:"pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Waiting..." : "NO"}
            </button>
          </div>
        ) : null}

        {hasVoted ? (
          <p style={{ textAlign:"center", color:"#534AB7", marginBottom:"1rem" }}>You already voted!</p>
        ) : null}

        {account ? (
          <div style={{ marginBottom:"1.5rem" }}>
            <p style={{ textAlign:"center", fontWeight:"600", marginBottom:"12px" }}>Live Results</p>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
              <span style={{ width:"30px", color:"#1D9E75", fontWeight:"600", fontSize:"13px" }}>YES</span>
              <div style={{ flex:1, background:"#f0f0f0", borderRadius:"8px", height:"14px", overflow:"hidden" }}>
                <div style={{ width: yesPercent+"%", height:"100%", background:"#1D9E75", borderRadius:"8px" }} />
              </div>
              <span style={{ fontSize:"12px", color:"#888", minWidth:"70px" }}>{yesVotes} ({yesPercent}%)</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
              <span style={{ width:"30px", color:"#D85A30", fontWeight:"600", fontSize:"13px" }}>NO</span>
              <div style={{ flex:1, background:"#f0f0f0", borderRadius:"8px", height:"14px", overflow:"hidden" }}>
                <div style={{ width: noPercent+"%", height:"100%", background:"#D85A30", borderRadius:"8px" }} />
              </div>
              <span style={{ fontSize:"12px", color:"#888", minWidth:"70px" }}>{noVotes} ({noPercent}%)</span>
            </div>
            <p style={{ textAlign:"center", fontSize:"13px", color:"#aaa" }}>Total: {total}</p>
          </div>
        ) : null}

        {message ? (
          <p style={{ textAlign:"center", padding:"10px", background:"#f8f4ff", borderRadius:"8px", color:"#534AB7", marginBottom:"1rem" }}>{message}</p>
        ) : null}

        {account && votingOpen ? (
          <button onClick={endVoting} disabled={loading} style={{ width:"100%", padding:"12px", background:"white", color:"#D85A30", border:"2px solid #D85A30", borderRadius:"12px", fontSize:"14px", fontWeight:"600", cursor:"pointer", marginBottom:"1rem" }}>
            End Voting (Owner Only)
          </button>
        ) : null}

        {account ? (
          <p onClick={() => window.open("https://sepolia.etherscan.io/address/"+CONTRACT_ADDRESS)} style={{ textAlign:"center", fontSize:"13px", color:"#7F77DD", textDecoration:"underline", cursor:"pointer" }}>
            View on Etherscan
          </p>
        ) : null}

      </div>
    </div>
  );
}