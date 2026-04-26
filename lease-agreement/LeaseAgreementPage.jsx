import React, { useEffect, useMemo, useState } from "react";
import "./LeaseAgreementPage.css";

const API_BASE = "http://localhost:3000";

const STATUS_OPTIONS = [
  { value: "Occupied", label: "ไม่ว่าง" },
  { value: "Vacant", label: "ว่าง" },
  { value: "Maintenance", label: "ปรับปรุง" },
];

const PAYMENT_OPTIONS = [
  { value: "Cash", label: "เงินสด" },
  { value: "Debit/Credit Card", label: "Debit/Credit Card" },
  { value: "Bank Transfer", label: "โอนผ่านบัญชี" },
];

const EMPTY_FORM = {
  roomStatus: "Vacant",
  tenantName: "",
  startDate: "",
  endDate: "",
  monthlyRent: "",
  durationMonths: "",
  deposit: "",
  paymentMethod: "",
  contractImage: "",
};

function normalizeDateInput(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    let [, dd, mm, yyyy] = match;
    let year = Number(yyyy);

    // รองรับ พ.ศ.
    if (year > 2400) year -= 543;

    return `${year}-${mm}-${dd}`;
  }

  return "";
}

function formatDisplayDate(value) {
  if (!value) return "-";

  // ถ้าเป็นรูป dd/mm/yyyy ให้คืนค่าตามเดิม
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(value))) return value;

  const iso = normalizeDateInput(value);
  if (!iso) return "-";

  const [y, m, d] = iso.split("-");
  const thaiYear = Number(y) + 543;

  return `${d}/${m}/${thaiYear}`;
}

function getMonthDiff(startDate, endDate) {
  const start = normalizeDateInput(startDate);
  const end = normalizeDateInput(endDate);

  if (!start || !end) return "";

  const s = new Date(start);
  const e = new Date(end);

  let months =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth());

  if (e.getDate() < s.getDate()) {
    months -= 1;
  }

  return months > 0 ? months : "";
}

function computeEndDate(startDate, months) {
  const start = normalizeDateInput(startDate);
  const monthCount = Number(months);

  if (!start || !monthCount || monthCount < 1) return "";

  const d = new Date(start);
  d.setMonth(d.getMonth() + monthCount);

  return d.toISOString().slice(0, 10);
}

function toStatusLabel(status) {
  const found = STATUS_OPTIONS.find((item) => item.value === status);
  return found ? found.label : status || "-";
}

function toPaymentLabel(value) {
  const found = PAYMENT_OPTIONS.find((item) => item.value === value);
  return found ? found.label : value || "-";
}

function makeFormState(record) {
  if (!record) return { ...EMPTY_FORM };

  return {
    roomStatus: record.roomStatus || "Vacant",
    tenantName: record.tenantName || "",
    startDate: normalizeDateInput(record.startDate),
    endDate: normalizeDateInput(record.endDate),
    monthlyRent:
      record.monthlyRent !== undefined && record.monthlyRent !== null
        ? String(record.monthlyRent)
        : record.price
        ? String(record.price)
        : "",
    durationMonths:
      record.durationMonths !== undefined && record.durationMonths !== null && record.durationMonths !== ""
        ? String(record.durationMonths)
        : getMonthDiff(record.startDate, record.endDate)
        ? String(getMonthDiff(record.startDate, record.endDate))
        : "",
    deposit:
      record.deposit !== undefined && record.deposit !== null
        ? String(record.deposit)
        : "",
    paymentMethod: record.paymentMethod || "",
    contractImage: record.contractImage || "",
  };
}

function buildRoomRecords(payload) {
  const users = payload.users || [];
  const rooms = payload.rooms || [];
  const leases = payload.leases || [];

  return rooms.map((room) => {
    const tenantUser =
      users.find((u) => String(u.room) === String(room.no)) ||
      users.find((u) => u.name === room.tenant) ||
      null;

    const lease =
      leases.find((l) => String(l.room) === String(room.no)) || null;

    return {
      no: room.no,
      floor: room.floor || "-",
      type: room.type || "-",
      price: room.price || "",
      roomStatus: room.status || "Vacant",
      tenantName:
        room.tenant && room.tenant !== "-" ? room.tenant : tenantUser?.name || "",
      startDate: lease?.start_date || "",
      endDate: lease?.end_date || "",
      monthlyRent: lease?.rent ?? room.price ?? "",
      durationMonths: lease?.duration_months ?? getMonthDiff(lease?.start_date, lease?.end_date) ?? "",
      deposit: lease?.deposit ?? "",
      paymentMethod: lease?.payment_method ?? "",
      contractImage: lease?.contract_image ?? "",
      userId: tenantUser?.id || null,
    };
  });
}

function FieldError({ text }) {
  if (!text) return null;
  return <div className="lease-field-error">{text}</div>;
}

export default function LeaseAgreementPage() {
  const [records, setRecords] = useState([]);
  const [selectedRoomNo, setSelectedRoomNo] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [mode, setMode] = useState("view"); // view | edit | create
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const selectedRecord = useMemo(() => {
    return (
      records.find((item) => String(item.no) === String(selectedRoomNo)) || null
    );
  }, [records, selectedRoomNo]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      setForm(makeFormState(selectedRecord));
      setMode("view");
      setErrors({});
      setPageMessage("");
      setPageError("");
    }
  }, [selectedRecord]);

  async function loadData(preferredRoomNo) {
    setLoading(true);
    setPageError("");

    try {
      const res = await fetch(`${API_BASE}/api/master`);
      if (!res.ok) throw new Error("โหลดข้อมูล Lease & Agreement ไม่สำเร็จ");

      const payload = await res.json();
      const built = buildRoomRecords(payload);

      setRecords(built);

      setSelectedRoomNo((current) => {
        if (preferredRoomNo && built.some((item) => String(item.no) === String(preferredRoomNo))) {
          return preferredRoomNo;
        }

        if (current && built.some((item) => String(item.no) === String(current))) {
          return current;
        }

        return built[0]?.no || "";
      });
    } catch (error) {
      setPageError(error.message || "ไม่สามารถโหลดข้อมูลได้");
      setRecords([]);
      setSelectedRoomNo("");
    } finally {
      setLoading(false);
    }
  }

  function beginEdit() {
    if (!selectedRecord) return;

    const nextMode =
      !selectedRecord.tenantName || selectedRecord.roomStatus === "Vacant"
        ? "create"
        : "edit";

    setMode(nextMode);
    setErrors({});
    setPageMessage("");
    setPageError("");
    setForm(makeFormState(selectedRecord));
  }

  function cancelEdit() {
    setMode("view");
    setErrors({});
    setPageMessage("");
    setPageError("");
    setForm(makeFormState(selectedRecord));
  }

  function handleInputChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "monthlyRent") {
        if (!prev.deposit || String(prev.deposit) === String(prev.monthlyRent)) {
          next.deposit = value;
        }
      }

      if ((field === "startDate" || field === "durationMonths") && next.startDate && next.durationMonths) {
        next.endDate = computeEndDate(next.startDate, next.durationMonths);
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleImageChange(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        contractImage: "อัปโหลดได้เฉพาะไฟล์รูปภาพเท่านั้น",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        contractImage: String(reader.result || ""),
      }));
      setErrors((prev) => ({ ...prev, contractImage: "" }));
    };
    reader.readAsDataURL(file);
  }

  function validateForm() {
    const nextErrors = {};
    const today = new Date().toISOString().slice(0, 10);

    if (!form.roomStatus) {
      nextErrors.roomStatus = "กรุณาเลือกสถานะห้อง";
    }

    if (!form.tenantName.trim()) {
      nextErrors.tenantName = "กรุณากรอกรายชื่อผู้พักอาศัย";
    }

    if (!form.startDate) {
      nextErrors.startDate = "กรุณาเลือกวันที่ทำสัญญา";
    } else if (mode === "create" && form.startDate !== today) {
      nextErrors.startDate = "วันที่ทำสัญญาควรเป็นวันปัจจุบัน";
    }

    if (!form.durationMonths) {
      nextErrors.durationMonths = "กรุณากรอกระยะเวลาการเช่า";
    } else if (Number(form.durationMonths) < 1 || Number.isNaN(Number(form.durationMonths))) {
      nextErrors.durationMonths = "ระยะเวลาการเช่าต้องไม่น้อยกว่า 1 เดือน";
    }

    if (!form.endDate) {
      nextErrors.endDate = "กรุณาเลือกวันที่สิ้นสุดสัญญา";
    } else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
      nextErrors.endDate = "วันที่สิ้นสุดสัญญาต้องมากกว่าวันที่ทำสัญญา";
    } else if (
      form.startDate &&
      form.durationMonths &&
      computeEndDate(form.startDate, form.durationMonths) !== form.endDate
    ) {
      nextErrors.endDate = "วันที่สิ้นสุดสัญญาต้องสัมพันธ์กับระยะเวลาการเช่า";
    }

    if (!form.monthlyRent) {
      nextErrors.monthlyRent = "กรุณากรอกค่าเช่าต่อเดือน";
    } else if (Number(form.monthlyRent) <= 0 || Number.isNaN(Number(form.monthlyRent))) {
      nextErrors.monthlyRent = "ค่าเช่าต่อเดือนต้องเป็นตัวเลขมากกว่า 0";
    }

    if (!form.deposit) {
      nextErrors.deposit = "กรุณากรอกจำนวนเงินมัดจำ";
    } else if (Number(form.deposit) !== Number(form.monthlyRent)) {
      nextErrors.deposit = "เงินมัดจำต้องเท่ากับค่าเช่าห้อง 1 เท่า";
    }

    if (!form.paymentMethod) {
      nextErrors.paymentMethod = "กรุณาเลือกช่องทางการชำระเงินมัดจำ";
    }

    if (!form.contractImage) {
      nextErrors.contractImage = "กรุณาอัปโหลดรูปสัญญาเช่า";
    }

    return nextErrors;
  }

  async function handleSave() {
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setPageMessage("");
    setPageError("");

    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedRoomNo) return;

    setSaving(true);

    try {
      const effectiveStatus =
        form.roomStatus === "Vacant" && form.tenantName.trim()
          ? "Occupied"
          : form.roomStatus;

      const payload = {
        roomNo: selectedRoomNo,
        roomStatus: effectiveStatus,
        tenantName: form.tenantName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        monthlyRent: Number(form.monthlyRent),
        durationMonths: Number(form.durationMonths),
        deposit: Number(form.deposit),
        paymentMethod: form.paymentMethod,
        contractImage: form.contractImage,
      };

      const res = await fetch(`${API_BASE}/api/lease-agreements/${selectedRoomNo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      await loadData(selectedRoomNo);
      setMode("view");
      setPageMessage("บันทึกข้อมูลสัญญาเช่าเรียบร้อยแล้ว");
    } catch (error) {
      setPageError(error.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="lease-page">
        <div className="lease-loading">กำลังโหลดข้อมูล Lease & Agreement...</div>
      </div>
    );
  }

  if (!selectedRecord) {
    return (
      <div className="lease-page">
        <div className="lease-error-box">ไม่พบข้อมูลห้องพัก</div>
      </div>
    );
  }

  const isViewMode = mode === "view";
  const mainActionLabel =
    !selectedRecord.tenantName || selectedRecord.roomStatus === "Vacant"
      ? "New Resident"
      : "Edit";

  return (
    <div className="lease-page">
      {pageMessage ? <div className="lease-page-message success">{pageMessage}</div> : null}
      {pageError ? <div className="lease-page-message error">{pageError}</div> : null}

      <div className="lease-top-row">
        <div className="lease-room-banner">
          <div className="lease-room-select-wrap">
            <label className="lease-label-inline">ห้อง</label>
            <select
              className="lease-room-select"
              value={selectedRoomNo}
              onChange={(e) => setSelectedRoomNo(e.target.value)}
            >
              {records.map((item) => (
                <option key={item.no} value={item.no}>
                  ห้อง {item.no}
                </option>
              ))}
            </select>
          </div>

          {isViewMode ? (
            <div className={`lease-status-pill ${String(form.roomStatus || "").toLowerCase()}`}>
              {toStatusLabel(form.roomStatus)}
            </div>
          ) : (
            <div className="lease-status-edit-wrap">
              <label className="lease-label-inline">สถานะ</label>
              <select
                className="lease-status-select"
                value={form.roomStatus}
                onChange={(e) => handleInputChange("roomStatus", e.target.value)}
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <FieldError text={errors.roomStatus} />
            </div>
          )}
        </div>

        <div className="lease-main-title">รายละเอียดสัญญาการเช่า</div>
      </div>

      <div className="lease-content-card">
        <div className="lease-left-panel">
          <div className="lease-grid">
            <div className="lease-field lease-field-full">
              <label>รายชื่อผู้พักอาศัย</label>
              {isViewMode ? (
                <div className="lease-value-box">{form.tenantName || "-"}</div>
              ) : (
                <>
                  <input
                    type="text"
                    value={form.tenantName}
                    onChange={(e) => handleInputChange("tenantName", e.target.value)}
                    placeholder="กรอกรายชื่อผู้พักอาศัย"
                  />
                  <FieldError text={errors.tenantName} />
                </>
              )}
            </div>

            <div className="lease-field">
              <label>วันที่จัดทำสัญญา</label>
              {isViewMode ? (
                <div className="lease-value-box">{formatDisplayDate(form.startDate)}</div>
              ) : (
                <>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                  <FieldError text={errors.startDate} />
                </>
              )}
            </div>

            <div className="lease-field">
              <label>วันที่สิ้นสุดสัญญา</label>
              {isViewMode ? (
                <div className="lease-value-box">{formatDisplayDate(form.endDate)}</div>
              ) : (
                <>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                  <FieldError text={errors.endDate} />
                </>
              )}
            </div>

            <div className="lease-field">
              <label>ค่าเช่าห้อง / เดือน</label>
              {isViewMode ? (
                <div className="lease-value-box">
                  {form.monthlyRent ? Number(form.monthlyRent).toLocaleString() : "-"} บาท / เดือน
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    value={form.monthlyRent}
                    onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                    placeholder="เช่น 4500"
                  />
                  <FieldError text={errors.monthlyRent} />
                </>
              )}
            </div>

            <div className="lease-field">
              <label>ระยะเวลาการเช่าห้อง</label>
              {isViewMode ? (
                <div className="lease-value-box">
                  {form.durationMonths ? `${form.durationMonths} เดือน` : "-"}
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    min="1"
                    value={form.durationMonths}
                    onChange={(e) => handleInputChange("durationMonths", e.target.value)}
                    placeholder="เช่น 12"
                  />
                  <FieldError text={errors.durationMonths} />
                </>
              )}
            </div>

            <div className="lease-field">
              <label>จำนวนเงินมัดจำ</label>
              {isViewMode ? (
                <div className="lease-value-box">
                  {form.deposit ? Number(form.deposit).toLocaleString() : "-"} บาท
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    value={form.deposit}
                    onChange={(e) => handleInputChange("deposit", e.target.value)}
                    placeholder="ต้องเท่ากับค่าเช่าห้อง"
                  />
                  <FieldError text={errors.deposit} />
                </>
              )}
            </div>

            <div className="lease-field">
              <label>ช่องทางการชำระเงินมัดจำ</label>
              {isViewMode ? (
                <div className="lease-value-box">{toPaymentLabel(form.paymentMethod)}</div>
              ) : (
                <>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                  >
                    <option value="">-- เลือกช่องทางการชำระ --</option>
                    {PAYMENT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <FieldError text={errors.paymentMethod} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lease-right-panel">
          <div className="lease-image-card">
            <div className="lease-image-title">เอกสารสัญญาเช่า</div>

            <div className="lease-image-preview">
              {form.contractImage ? (
                <img src={form.contractImage} alt="contract preview" />
              ) : (
                <div className="lease-image-placeholder">ยังไม่มีไฟล์สัญญา</div>
              )}
            </div>

            {!isViewMode && (
              <div className="lease-upload-wrap">
                <input
                  id="leaseContractImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />
                <FieldError text={errors.contractImage} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lease-action-row">
        {isViewMode ? (
          <button className="lease-btn primary" onClick={beginEdit}>
            {mainActionLabel}
          </button>
        ) : (
          <>
            <button className="lease-btn secondary" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
            <button className="lease-btn success" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}