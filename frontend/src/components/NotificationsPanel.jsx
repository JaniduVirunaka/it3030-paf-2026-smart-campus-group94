import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getNotifications, markNotificationRead } from '../services/api';

export default function NotificationsPanel({ userId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await getNotifications(userId);
        setNotes(res.data);
        setError(null);
      } catch (err) {
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotes((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
    } catch (err) {
      setError('Failed to mark notification as read.');
    }
  };

  return (
    <div>
      <h3>Notifications</h3>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && notes.length === 0 && !error && <p>No notifications yet.</p>}
      <ul>
        {notes.map((n) => (
          <li key={n.id} style={{ opacity: n.read ? 0.6 : 1 }}>
            {n.message}
            {!n.read && <button onClick={() => handleRead(n.id)}>Mark read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

NotificationsPanel.propTypes = {
  userId: PropTypes.string.isRequired,
};
