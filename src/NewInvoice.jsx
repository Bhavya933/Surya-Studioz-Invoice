import React, { useState } from 'react';
import { Plus, Trash2, Download, Printer, History, LayoutGrid, Save } from 'lucide-react';
import studioLogo from './assets/image.png';

const EMPTY_ITEM = { name: '', description: '', rate: 0, qty: 1 };

const NewInvoice = ({ 
  invoice, 
  setInvoice, 
  company, 
  setCompany, 
  onNewInvoice, 
  onNavigate, 
  onDownload, 
  onSave,
  invoiceRef,
  isDarkMode
}) => {
  const theme = {
    bg: isDarkMode ? '#1e293b' : '#f8fafc',
    card: isDarkMode ? '#334155' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#1a1c2e',
    muted: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#475569' : '#f1f5f9',
    inputBg: isDarkMode ? '#1e293b' : '#ffffff'
  };
  
  const updateClient = (field, value) => {
    setInvoice({ ...invoice, client: { ...invoice.client, [field]: value } });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoice({ ...invoice, items: newItems });
  };

  const addItem = () => {
    setInvoice({ ...invoice, items: [...invoice.items, { ...EMPTY_ITEM }] });
  };

  const removeItem = (index) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: newItems.length ? newItems : [{ ...EMPTY_ITEM }] });
  };

  const safeItems = Array.isArray(invoice.items) ? invoice.items : [];
  const safeDeliverables = Array.isArray(invoice.deliverables) ? invoice.deliverables : [];
  const safeTerms = Array.isArray(invoice.terms) ? invoice.terms : [];
  const safeTaxRate = parseFloat(invoice.taxRate) || 0;
  const safeAmountPaid = parseFloat(invoice.amountPaid) || 0;

  const subtotal = safeItems.reduce((sum, item) => sum + ((parseFloat(item.rate) || 0) * (parseInt(item.qty) || 0)), 0);
  const taxAmount = (subtotal * safeTaxRate) / 100;
  const total = subtotal + taxAmount;
  const balanceDue = total - safeAmountPaid;
  const [showPrintModal, setShowPrintModal] = useState(false);

  const printInvoice = () => {
    const invoiceEl = invoiceRef?.current;
    if (!invoiceEl) return;

    // Clone the invoice HTML
    const content = invoiceEl.cloneNode(true);

    // Replace inputs with their current values (so text shows in print)
    content.querySelectorAll('input, textarea').forEach(el => {
      const span = document.createElement('span');
      span.textContent = el.value || '';
      span.style.cssText = el.style.cssText;
      span.style.whiteSpace = 'pre-wrap';
      span.style.wordBreak = 'break-word';
      if (el.tagName.toLowerCase() === 'textarea') {
        span.style.display = 'block';
      } else {
        span.style.display = 'inline-block';
      }
      el.parentNode.replaceChild(span, el);
    });

    // Remove buttons (Add Item, Delete, etc.)
    content.querySelectorAll('button').forEach(btn => btn.remove());

    // Create a hidden iframe — no new window/tab
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.number || ''}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              background: white;
              color: #1a1a1a;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page { margin: 10mm; size: A4; }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
    doc.close();

    // Wait for content to render, then print and remove the iframe
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

      {/* ===== CUSTOM PRINT PREVIEW MODAL ===== */}
      {showPrintModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(10,12,30,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: theme.card, borderRadius: '24px',
            width: '100%', maxWidth: '860px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
            border: '1px solid ' + theme.border
          }}>
            {/* Modal Header */}
            <div style={{
              background: isDarkMode ? '#1e293b' : '#1a1c2e', padding: '20px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              borderBottom: '1px solid ' + theme.border
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#f97316', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  <Printer size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>Print Invoice</h2>
                  <p style={{ color: isDarkMode ? '#94a3b8' : '#9ca3af', fontSize: '12px', margin: 0 }}>{invoice.number} · {invoice.date}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            {/* Invoice Info Preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: theme.bg, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary Card */}
              <div style={{ background: theme.card, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid ' + theme.border }}>
                <div>
                  <p style={{ color: theme.muted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Client</p>
                  <p style={{ color: theme.text, fontSize: '18px', fontWeight: '800', margin: 0 }}>{invoice.client?.name || 'Untitled Client'}</p>
                  <p style={{ color: theme.muted, fontSize: '13px', margin: '4px 0 0' }}>{invoice.client?.phone || ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: theme.muted, fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Invoice No.</p>
                  <p style={{ color: '#f97316', fontSize: '18px', fontWeight: '800', margin: 0 }}>{invoice.number}</p>
                  <p style={{ color: theme.muted, fontSize: '13px', margin: '4px 0 0' }}>{invoice.date}</p>
                </div>
              </div>

              {/* Amount Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Subtotal', value: `₹${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: theme.text },
                  { label: 'Tax / GST', value: `₹${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: theme.text },
                  { label: 'Balance Due', value: `₹${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: balanceDue > 0 ? '#dc2626' : '#16a34a' },
                ].map(item => (
                  <div key={item.label} style={{ background: theme.card, borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid ' + theme.border }}>
                    <p style={{ color: theme.muted, fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{item.label}</p>
                    <p style={{ color: item.color, fontSize: '20px', fontWeight: '800', margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Print info */}
              <div style={{ background: isDarkMode ? '#6366f120' : '#eef2ff', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid ' + (isDarkMode ? '#6366f140' : '#e0e7ff') }}>
                <div style={{ background: '#6366f1', borderRadius: '6px', padding: '6px', display: 'flex' }}><Printer size={14} color="#fff" /></div>
                <p style={{ color: isDarkMode ? '#818cf8' : '#4338ca', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                  Invoice will be printed as a clean A4 document — sidebar and app UI will not appear.
                </p>
              </div>
            </div>

            {/* Action Footer */}
            <div style={{
              background: theme.card, borderTop: '1px solid ' + theme.border,
              padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <p style={{ color: theme.muted, fontSize: '13px', margin: 0 }}>Ready to print · 1 page · A4</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowPrintModal(false)}
                  style={{ background: isDarkMode ? '#475569' : '#f1f5f9', color: theme.text, border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={() => { printInvoice(); setShowPrintModal(false); }}
                  style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                ><Printer size={15} /> Print Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="no-print" style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={onSave}
          style={{ background: isDarkMode ? '#16a34a20' : '#f0fdf4', color: '#16a34a', border: '1px solid ' + (isDarkMode ? '#16a34a40' : '#bbf7d0'), borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        ><Save size={16} /> Save to History</button>
        <button
          onClick={() => setShowPrintModal(true)}
          style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        ><Printer size={16} /> Print Invoice</button>
      </div>

      {/* --- COMPACT WHITE SHEET — fits 1 PDF page --- */}
      <div 
        ref={invoiceRef}
        className="invoice-paper-final"
        style={{ 
          background: 'white', 
          width: '100%', 
          maxWidth: '860px', 
          padding: '40px 48px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.05)', 
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '28%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <img src={studioLogo} alt="Surya Studio" style={{ width: '140px', height: 'auto', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, padding: '0 24px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px 0' }}>{company.name}</h1>
            <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'pre-line', lineHeight: '1.5', marginBottom: '8px' }}>
              {company.address}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '12px' }}>Phone No.- <input style={{ fontWeight: 'bold', color: '#444', border: 'none', background: 'transparent', fontSize: '12px', padding: '0', width: 'auto', minWidth: '100px' }} value={company.phone} onChange={(e) => setCompany({...company, phone: e.target.value})} /></div>
              <div style={{ fontSize: '12px' }}>Email - <input style={{ color: '#666', border: 'none', background: 'transparent', fontSize: '12px', padding: '0', width: 'auto', minWidth: '140px' }} value={company.email} onChange={(e) => setCompany({...company, email: e.target.value})} /></div>
              <div style={{ fontSize: '12px' }}>GSTIN: <input style={{ color: '#666', border: 'none', background: 'transparent', fontSize: '12px', padding: '0', width: 'auto', minWidth: '100px' }} value={company.gstin} onChange={(e) => setCompany({...company, gstin: e.target.value})} /></div>
            </div>
          </div>
          <div style={{ width: '24%', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', letterSpacing: '1px', marginBottom: '2px' }}>Invoice</div>
              <input style={{ fontSize: '15px', fontWeight: 'bold', border: 'none', textAlign: 'right', width: '100%', background: 'transparent' }} value={invoice.number} onChange={(e) => setInvoice({...invoice, number: e.target.value})} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', letterSpacing: '1px', marginBottom: '2px' }}>Date</div>
              <input type="date" style={{ fontSize: '12px', fontWeight: 'bold', border: 'none', background: 'transparent', textAlign: 'right', direction: 'rtl' }} value={invoice.date} onChange={(e) => setInvoice({...invoice, date: e.target.value})} />
            </div>
            <div>
               <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', letterSpacing: '1px', marginBottom: '2px' }}>Balance Due</div>
               <div style={{ fontSize: '18px', fontWeight: 'bold' }}>₹{balanceDue.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Client Details */}
        <div style={{ background: '#f8f9fa', padding: '16px 20px', borderRadius: '6px', borderLeft: '3px solid #ddd' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#999', borderBottom: '1px solid #eee', paddingBottom: '4px', marginBottom: '4px' }}>Bill To</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '60px' }}>Name:</span>
              <input style={{ fontSize: '15px', fontWeight: 'bold', border: 'none', background: 'transparent', flex: 1 }} placeholder="Client Name" value={invoice.client?.name || ''} onChange={(e) => updateClient('name', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '60px' }}>Address:</span>
              <textarea 
                style={{ fontSize: '12px', color: '#666', border: 'none', background: 'transparent', resize: 'none', flex: 1, overflow: 'hidden', fontFamily: 'inherit' }} 
                placeholder="Client Address..." 
                rows={2} 
                value={invoice.client?.address || ''} 
                onChange={(e) => updateClient('address', e.target.value)} 
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eef0f2', paddingTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Phone:</span>
                   <input style={{ fontSize: '12px', border: 'none', background: 'transparent', width: '130px' }} placeholder="Phone" value={invoice.client?.phone || ''} onChange={(e) => updateClient('phone', e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <span style={{ fontSize: '12px', fontWeight: 'bold' }}>GSTIN:</span>
                   <input style={{ fontSize: '12px', border: 'none', background: 'transparent', padding: '0', width: 'auto', minWidth: '80px' }} placeholder="Optional" value={invoice.client?.gstin || ''} onChange={(e) => updateClient('gstin', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', width: '55%' }}>Description</th>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', width: '16%' }}>Rate</th>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', width: '10%' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '11px', textTransform: 'uppercase', color: '#999', width: '19%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {safeItems.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px dashed #ccc' }}>
                <td style={{ padding: '16px 0', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input 
                      style={{ fontWeight: 'bold', width: '100%', border: 'none', fontSize: '14px', background: 'transparent', padding: 0, outline: 'none' }} 
                      placeholder="Item Title (e.g. Traditional Photo)" 
                      value={item.name || ''} 
                      onChange={(e) => updateItem(index, 'name', e.target.value)} 
                    />
                    <textarea 
                      style={{ width: '100%', border: 'none', fontSize: '13px', color: '#555', background: 'transparent', resize: 'none', overflow: 'hidden', fontFamily: 'inherit', padding: 0, outline: 'none' }} 
                      placeholder="Details (e.g. 1 Photographer)" 
                      rows={1}
                      value={item.description || ''} 
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                    />
                  </div>
                </td>
                <td style={{ fontSize: '13px' }}>
                  <input type="text" inputMode="decimal" style={{ width: '100%', border: 'none', fontSize: '13px', background: 'transparent' }} value={item.rate === undefined ? '' : item.rate} onFocus={(e) => e.target.select()} onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)} />
                </td>
                <td style={{ fontSize: '13px' }}>
                  <input type="text" inputMode="numeric" style={{ width: '100%', border: 'none', fontWeight: 'bold', fontSize: '13px', background: 'transparent' }} value={item.qty === undefined ? '' : item.qty} onFocus={(e) => e.target.select()} onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)} />
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', padding: '10px 0' }}>
                  {(() => {
                    const rowAmt = (parseFloat(item.rate) || 0) * (parseInt(item.qty) || 0);
                    return rowAmt < 0 
                      ? `-₹${Math.abs(rowAmt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : `₹${rowAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  })()}
                  <button onClick={() => removeItem(index)} className="no-print" style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0' }}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="no-print" style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #ccc', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={addItem}><Plus size={13} /> Add Item</button>

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '13px', color: '#666' }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 'bold' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '13px', color: '#666' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Tax / GST</span>
              <input 
                type="text" 
                inputMode="decimal"
                style={{ width: '40px', border: 'none', borderBottom: '1px solid #999', fontSize: '13px', textAlign: 'center', background: 'transparent', outline: 'none' }} 
                value={invoice.taxRate || 0} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => setInvoice({...invoice, taxRate: parseFloat(e.target.value) || 0})} 
              />
              <span>%</span>
            </div>
            <span style={{ fontWeight: 'bold' }}>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', padding: '8px 0', borderTop: '1px solid #000', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '15px' }}>
            <span>Total</span>
            <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '220px', fontSize: '13px', color: '#999' }}>
            <span>Amount Paid</span>
            <div style={{ fontWeight: 'bold', color: '#444' }}>₹<input type="text" inputMode="decimal" style={{ width: '70px', textAlign: 'right', border: 'none', background: 'transparent', fontSize: '13px' }} value={invoice.amountPaid} onFocus={(e) => e.target.select()} onChange={(e) => setInvoice({...invoice, amountPaid: parseFloat(e.target.value) || 0})} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #000', fontWeight: '700', fontSize: '16px', textTransform: 'uppercase' }}>
            <span>Balance Due</span>
            <span>INR {balanceDue < 0 ? '-' : ''}₹{Math.abs(balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Deliverables & Terms */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '10px', fontWeight: 'bold', color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px', margin: '0 0 12px 0' }}>Deliverables</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {safeDeliverables.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#ddd', fontSize: '12px' }}>•</span>
                  <textarea 
                    style={{ padding: '0', fontSize: '12px', color: '#555', width: '100%', border: 'none', resize: 'none', overflow: 'hidden', background: 'transparent', fontFamily: 'inherit' }} 
                    rows={1}
                    value={d || ''} 
                    onChange={(e) => {
                      const newD = [...safeDeliverables];
                      newD[i] = e.target.value;
                      setInvoice({...invoice, deliverables: newD});
                    }} 
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                  />
                  <button className="no-print" onClick={() => {
                      const newD = safeDeliverables.filter((_, idx) => idx !== i);
                      setInvoice({...invoice, deliverables: newD});
                    }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0', flexShrink: 0 }}>×</button>
                </div>
              ))}
              <button className="no-print" style={{ color: '#0066ff', background: 'none', border: 'none', fontSize: '11px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', marginTop: '6px' }} onClick={() => setInvoice({...invoice, deliverables: [...safeDeliverables, '']})}>
                 + Add Deliverable
              </button>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '10px', fontWeight: 'bold', color: '#bbb', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px 0' }}>Terms & Conditions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {safeTerms.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'start' }}>
                  <span style={{ color: '#ddd', fontSize: '12px' }}>-</span>
                  <textarea 
                    style={{ padding: '0', fontSize: '11px', color: '#888', width: '100%', border: 'none', resize: 'none', textTransform: 'uppercase', background: 'transparent', overflow: 'hidden', fontFamily: 'inherit' }} 
                    rows={1} 
                    value={t || ''} 
                    onChange={(e) => {
                      const newT = [...safeTerms];
                      newT[i] = e.target.value;
                      setInvoice({...invoice, terms: newT});
                    }} 
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                  />
                  <button className="no-print" onClick={() => {
                      const newT = safeTerms.filter((_, idx) => idx !== i);
                      setInvoice({...invoice, terms: newT});
                    }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0', flexShrink: 0 }}>×</button>
                </div>
              ))}
              <button className="no-print" style={{ color: '#0066ff', background: 'none', border: 'none', fontSize: '11px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', marginTop: '6px' }} onClick={() => setInvoice({...invoice, terms: [...safeTerms, '']})}>
                 + Add Term
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoice;
