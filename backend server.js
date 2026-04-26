app.get('/api/staff/rooms', async (req, res) => {
  const db = openDb();

  try {
    const rooms = await allAsync(db, `
      SELECT 
        r.no,
        r.floor,
        r.type,
        r.price,
        r.status,
        r.tenant,
        COALESCE(
          (
            SELECT b.status
            FROM bills b
            WHERE b.room = r.no
            ORDER BY b.due DESC
            LIMIT 1
          ),
          '-'
        ) AS bill_status,
        COALESCE(
          (
            SELECT b.due
            FROM bills b
            WHERE b.room = r.no
            ORDER BY b.due DESC
            LIMIT 1
          ),
          '-'
        ) AS checkout_date
      FROM rooms r
      ORDER BY CAST(r.no AS INTEGER)
    `);

    const totalRooms = rooms.length;

    const vacantRooms = rooms.filter(room =>
      String(room.status || '').toLowerCase() === 'vacant'
    ).length;

    const unpaidRooms = rooms.filter(room =>
      ['pending', 'unpaid', 'overdue'].includes(
        String(room.bill_status || '').toLowerCase()
      )
    ).length;

    res.json({
      ok: true,
      summary: {
        totalRooms,
        vacantRooms,
        unpaidRooms
      },
      rooms
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});
