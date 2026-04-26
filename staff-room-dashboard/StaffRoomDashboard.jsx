import React, { useEffect, useMemo, useState } from "react";
import "./StaffRoomDashboard.css";

export default function StaffRoomDashboard() {
  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState({
    totalRooms: 0,
    vacantRooms: 0,
    unpaidRooms: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // สำหรับ modal รายละเอียด
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/staff/rooms");

      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setSummary(
          data.summary || {
            totalRooms: (data.rooms || []).length,
            vacantRooms: (data.rooms || []).filter(
              (r) => String(r.status).toLowerCase() === "vacant"
            ).length,
            unpaidRooms: (data.rooms || []).filter((r) =>
              ["pending", "unpaid", "overdue"].includes(
                String(r.bill_status || "").toLowerCase()
              )
            ).length,
          }
        );
        return;
      }

      // fallback ถ้ายังไม่มี endpoint staff
      const fallbackRes = await fetch("http://localhost:3000/api/rooms");
      const fallbackData = await fallbackRes.json();

      const normalizedRooms = (fallbackData || []).map((r) => ({
        no: r.no,
        floor: r.floor || "-",
        type: r.type || "-",
        tenant: r.tenant || "-",
        price: r.price || 0,
        checkout_date: "-",
        bill_status: "-",
        status: r.status || "-",
      }));

      setRooms(normalizedRooms);
      setSummary({
        totalRooms: normalizedRooms.length,
        vacantRooms: normalizedRooms.filter(
          (r) => String(r.status).toLowerCase() === "vacant"
        ).length,
        unpaidRooms: 0,
      });
    } catch (error) {
      console.error("Load rooms failed:", error);
      setRooms([]);
      setSummary({
        totalRooms: 0,
        vacantRooms: 0,
        unpaidRooms: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return rooms;

    return rooms.filter((room) => {
      return (
        String(room.no || "").toLowerCase().includes(keyword) ||
        String(room.tenant || "").toLowerCase().includes(keyword) ||
        String(room.price || "").toLowerCase().includes(keyword)
      );
    });
  }, [rooms, search]);

  const getTenantText = (tenant) => {
    if (!tenant || tenant === "-" || tenant === "null") return "-";
    return tenant;
  };

  const getBillText = (status) => {
    const s = String(status || "").toLowerCase();

    if (["pending", "unpaid", "overdue"].includes(s)) {
      return "ค้างชำระ";
    }

    if (s === "paid") {
      return "-";
    }

    return "-";
  };

  const formatStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "vacant") return "ห้องว่าง";
    if (s === "occupied") return "มีผู้เช่า";
    if (s === "maintenance") return "ซ่อมบำรุง";
    return status || "-";
  };

  return (
    <div className="staff-room-content-only">
      <div className="room-toolbar">
        <input
          type="text"
          placeholder="ค้นหาห้อง / ผู้เช่า / ราคา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="room-search-input"
        />
      </div>

      <div className="summary-grid">
        <div className="summary-card summary-blue">
          <div className="summary-icon">🛏️</div>
          <div className="summary-text">
            ห้องพักทั้งหมด : <strong>{summary.totalRooms}</strong> ห้อง
          </div>
        </div>

        <div className="summary-card summary-green">
          <div className="summary-icon">🟩</div>
          <div className="summary-text">
            ห้องว่าง : <strong>{summary.vacantRooms}</strong> ห้อง
          </div>
        </div>

        <div className="summary-card summary-red">
          <div className="summary-icon">🕒</div>
          <div className="summary-text">
            ค้างชำระ : <strong>{summary.unpaidRooms}</strong> ห้อง
          </div>
        </div>
      </div>

      <div className="room-table-card">
        {loading ? (
          <div className="room-loading">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="room-table-wrap">
            <table className="room-table">
              <thead>
                <tr>
                  <th>ห้อง</th>
                  <th>ผู้เช่า</th>
                  <th>ราคาห้องพัก</th>
                  <th>แจ้งออก</th>
                  <th>ค้างชำระ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length > 0 ? (
                  filteredRooms.map((room, index) => (
                    <tr key={`${room.no}-${index}`}>
                      <td>{room.no}</td>
                      <td>{getTenantText(room.tenant)}</td>
                      <td>{Number(room.price || 0).toLocaleString()}</td>
                      <td>{room.checkout_date || "-"}</td>
                      <td>
                        {getBillText(room.bill_status) === "ค้างชำระ" ? (
                          <span className="bill-overdue">⏰ ค้างชำระ</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <button
                          className="detail-link-btn"
                          onClick={() => setSelectedRoom(room)}
                        >
                          รายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-cell">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal รายละเอียด */}
      {selectedRoom && (
        <div
          className="detail-modal-overlay"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-modal-header">
              <h3>รายละเอียดห้อง {selectedRoom.no}</h3>
              <button
                className="detail-close-btn"
                onClick={() => setSelectedRoom(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">เลขห้อง</span>
                <span className="detail-value">{selectedRoom.no || "-"}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">ชั้น</span>
                <span className="detail-value">{selectedRoom.floor || "-"}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">ประเภทห้อง</span>
                <span className="detail-value">{selectedRoom.type || "-"}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">ผู้เช่า</span>
                <span className="detail-value">
                  {getTenantText(selectedRoom.tenant)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">ราคาห้อง</span>
                <span className="detail-value">
                  {Number(selectedRoom.price || 0).toLocaleString()} บาท
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">สถานะห้อง</span>
                <span className="detail-value">
                  {formatStatus(selectedRoom.status)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">แจ้งออก</span>
                <span className="detail-value">
                  {selectedRoom.checkout_date || "-"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">ค้างชำระ</span>
                <span className="detail-value">
                  {getBillText(selectedRoom.bill_status)}
                </span>
              </div>
            </div>

            <div className="detail-modal-footer">
              <button
                className="detail-ok-btn"
                onClick={() => setSelectedRoom(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}