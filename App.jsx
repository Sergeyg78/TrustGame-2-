
import React, { useMemo, useState } from 'react';
import { BrowserProvider } from 'ethers';

const AI_PROFILES = [
  { name: 'Cautious', strategy: () => Math.floor(Math.random() * 20) + 5 },
  { name: 'Chaotic',  strategy: () => Math.floor(Math.random() * 100) },
  { name: 'Greedy',   strategy: () => Math.floor(Math.random() * 10) },
  { name: 'Altruistic', strategy: () => Math.floor(Math.random() * 50) + 25 },
  { name: 'Adaptive', strategy: () => Math.floor(Math.random() * 30) + 10 }
];

function shortAddr(a){ if(!a) return ''; return a.slice(0,6)+'...'+a.slice(-4); }

export default function App(){
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const [role, setRole] = useState(null);
  const [round, setRound] = useState(1);
  const [tokens, setTokens] = useState(100);
  const [aiTokens, setAiTokens] = useState(100);
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [sendInput, setSendInput] = useState('');
  const aiProfile = useMemo(()=>AI_PROFILES[Math.floor(Math.random()*AI_PROFILES.length)], []);

  async function connect(){
    if(!window.ethereum){ alert('Please install MetaMask'); return; }
    try{
      setConnecting(true);
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setWallet(accounts[0]);
    }catch(e){
      console.error(e);
      alert('Wallet connection rejected or failed.');
    }finally{
      setConnecting(false);
    }
  }

  function reset(){
    setRole(null); setRound(1); setTokens(100); setAiTokens(100);
    setHistory([]); setGameOver(false); setSendInput('');
  }

  function submitRound(){
    const playerSend = Math.max(0, Math.min(100, parseInt(sendInput||'0',10)));
    const multiplier = Math.floor(Math.random() * 4) + 2;
    const aiSend = aiProfile.strategy();

    let p = tokens - playerSend;
    let a = aiTokens - aiSend;

    if(role === 'Trustor'){
      const total = playerSend * multiplier;
      const aiReturn = Math.floor(Math.random() * (total+1)); // 0..total
      p += aiReturn;
      a += (total - aiReturn);
    }else{
      const total = aiSend * multiplier;
      const playerReturn = Math.floor(Math.random() * (total+1));
      a += playerReturn;
      p += (total - playerReturn);
    }

    const roundWinner = p > a ? 'Player' : a > p ? 'AI' : 'Tie';

    const rec = { round, multiplier, playerSend, aiSend: 'Hidden', playerGain:p, aiGain:a, roundWinner };
    setHistory(h=>[...h, rec]);
    setTokens(p); setAiTokens(a);
    setSendInput('');

    if(round >= 5){ setGameOver(true); } else { setRound(r=>r+1); }
  }

  return (
    <div className="container">
      <div className="gradient-anim" />
      <div className="card">

        <div className="header">
          <div className="title">TRUST Game — Solo vs AI <span className="badge">5 Rounds</span></div>
          {!wallet ? (
            <button className="btn" onClick={connect} disabled={connecting}>{connecting? 'Connecting...' : 'Connect Wallet'}</button>
          ) : (
            <div className="address">{shortAddr(wallet)}</div>
          )}
        </div>

        {!wallet && (
          <div className="section" style={{marginBottom:16}}>
            <div className="row">
              <div>Connect your wallet to start playing. MetaMask will request permission.</div>
            </div>
          </div>
        )}

        {wallet && !role && (
          <div className="grid" style={{marginTop:8}}>
            <div className="col-6 section">
              <h3>Choose Your Role</h3>
              <p className="small">Your role remains the same for all 5 rounds.</p>
              <div className="row" style={{marginTop:12}}>
                <button className="btn" onClick={()=>setRole('Trustor')}>Play as Trustor</button>
                <button className="btn secondary" onClick={()=>setRole('Trustee')}>Play as Trustee</button>
              </div>
            </div>
            <div className="col-6 section">
              <div className="kpi"><div className="num">{tokens}</div><div className="label">Your Tokens</div></div>
              <div className="kpi"><div className="num">Hidden</div><div className="label">AI Tokens</div></div>
              <div className="small" style={{marginTop:8}}>AI Persona: <b>{aiProfile.name}</b></div>
            </div>
          </div>
        )}

        {wallet && role && !gameOver && (
          <>
            <div className="grid" style={{marginTop:8}}>
              <div className="col-6 section">
                <div className="kpi"><div className="num">Round {round}/5</div><div className="label">Role: {role}</div></div>
                <div className="kpi" style={{marginTop:8}}><div className="num">{tokens}</div><div className="label">Your Tokens</div></div>
                <div className="kpi"><div className="num">Hidden</div><div className="label">AI Tokens</div></div>
              </div>
              <div className="col-6 section">
                <label className="small">Enter tokens to send</label>
                <input className="input" type="number" min="0" max="100" value={sendInput} onChange={e=>setSendInput(e.target.value)} placeholder="0" />
                <div className="footer">
                  <button className="btn warn" onClick={submitRound}>Submit Round</button>
                </div>
              </div>
            </div>

            <div className="section" style={{marginTop:12}}>
              <div className="small" style={{marginBottom:8}}>Round Log</div>
              <div className="log">
                {history.length===0 && <div className="log-item tie">No rounds yet. Decisions and outcomes will appear here.</div>}
                {history.map((r,i)=>(
                  <div key={i} className="log-item">
                    <div><b>Round {r.round}</b> ● Multiplier: x{r.multiplier} ● You sent: {r.playerSend} ● AI sent: {r.aiSend}</div>
                    <div className={r.roundWinner==='Player'?'win':r.roundWinner==='AI'?'lose':'tie'}>
                      {r.roundWinner==='Player'?'You won the round.': r.roundWinner==='AI' ? 'AI won the round.' : 'Round is a tie.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {wallet && role && gameOver && (
          <div className="section" style={{marginTop:8}}>
            <div className="kpi"><div className="num">{tokens}</div><div className="label">Your Final Tokens</div></div>
            <div className="kpi"><div className="num">Hidden</div><div className="label">AI Final Tokens</div></div>
            <div className="row" style={{marginTop:12}}>
              <div className="small">
                Winner: <b>
                  {tokens > aiTokens ? 'You' : tokens < aiTokens ? 'AI' : 'Tie'}
                </b>
              </div>
            </div>
            <div className="footer">
              <button className="btn secondary" onClick={reset}>Play Again</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
