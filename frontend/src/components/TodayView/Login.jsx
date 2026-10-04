import React, { useState } from 'react';
import * as api from '../../api/client';
import './TodayView.css';

function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    api.login(password).then(onSuccess).catch(() => setError('Wrong password')).finally(() => setBusy(false));
  };

  return (
    <form className="login" onSubmit={submit}>
      <h1>🧠 Knowledge Retriever</h1>
      <label htmlFor="kr-password">Password</label>
      <input id="kr-password" type="password" autoComplete="current-password" autoFocus
             value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="today-error" role="alert">{error}</p>}
      <button className="today-btn primary" type="submit" disabled={!password || busy}>Log in</button>
    </form>
  );
}

export default Login;
