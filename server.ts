import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_EMPLOYEES,
  INITIAL_LEADS,
  INITIAL_ATTENDANCE,
  INITIAL_BREAKS,
  INITIAL_FILES,
  INITIAL_CALL_LOGS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_QUEUES,
} from './src/data/initialData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data file path for durable persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'crm_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory store initialized from disk or default
let crmStore: {
  employees: any[];
  leads: any[];
  attendance: any[];
  breaks: any[];
  files: any[];
  callLogs: any[];
  leaves: any[];
  queues: any[];
  lastUpdated: string;
} = {
  employees: INITIAL_EMPLOYEES,
  leads: INITIAL_LEADS,
  attendance: INITIAL_ATTENDANCE,
  breaks: INITIAL_BREAKS,
  files: INITIAL_FILES,
  callLogs: INITIAL_CALL_LOGS,
  leaves: INITIAL_LEAVE_REQUESTS,
  queues: INITIAL_QUEUES,
  lastUpdated: new Date().toISOString(),
};

// Load saved data if present
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.employees && parsed.employees.length > 0) {
      crmStore = { ...crmStore, ...parsed };
      console.log(`[CRM Server] Loaded saved data from ${DATA_FILE}`);
    }
  } catch (err) {
    console.error('[CRM Server] Error reading saved data, starting fresh:', err);
  }
} else {
  // Persist initial seed so it stays consistent
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(crmStore, null, 2), 'utf-8');
  } catch (err) {}
}

function persistStore() {
  try {
    crmStore.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(crmStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CRM Server] Error writing to data file:', err);
  }
}

// --- API ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    recordsCount: {
      employees: crmStore.employees.length,
      leads: crmStore.leads.length,
      callLogs: crmStore.callLogs.length,
      attendance: crmStore.attendance.length,
    },
  });
});

// Full state sync (GET)
app.get('/api/sync', (req, res) => {
  res.json(crmStore);
});

// Full state sync (POST) - accepts updates from desktop or mobile client
app.post('/api/sync', (req, res) => {
  const { employees, leads, attendance, breaks, files, callLogs, leaves, queues } = req.body;

  if (employees && Array.isArray(employees)) crmStore.employees = employees;
  if (leads && Array.isArray(leads)) crmStore.leads = leads;
  if (attendance && Array.isArray(attendance)) crmStore.attendance = attendance;
  if (breaks && Array.isArray(breaks)) crmStore.breaks = breaks;
  if (files && Array.isArray(files)) crmStore.files = files;
  if (callLogs && Array.isArray(callLogs)) crmStore.callLogs = callLogs;
  if (leaves && Array.isArray(leaves)) crmStore.leaves = leaves;
  if (queues && Array.isArray(queues)) crmStore.queues = queues;

  persistStore();

  res.json({
    success: true,
    message: 'CRM state synchronized successfully across all devices',
    lastUpdated: crmStore.lastUpdated,
  });
});

// Real-time call log ingestion endpoint
app.post('/api/calls/log', (req, res) => {
  const newCall = req.body;
  if (!newCall || !newCall.employeeId) {
    return res.status(400).json({ error: 'Invalid call log data' });
  }

  const logWithId = {
    id: newCall.id || `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...newCall,
    timestamp: newCall.timestamp || new Date().toISOString(),
  };

  crmStore.callLogs.unshift(logWithId);

  // Update lead status if leadId is present
  if (newCall.leadId) {
    const leadIndex = crmStore.leads.findIndex((l) => l.id === newCall.leadId);
    if (leadIndex !== -1) {
      crmStore.leads[leadIndex] = {
        ...crmStore.leads[leadIndex],
        status: newCall.status || crmStore.leads[leadIndex].status,
        lastCalledAt: new Date().toISOString(),
        remarks: newCall.comments || crmStore.leads[leadIndex].remarks,
        nextFollowup: newCall.nextFollowup || crmStore.leads[leadIndex].nextFollowup,
      };
    }
  }

  persistStore();
  res.json({ success: true, callLog: logWithId });
});

// Real-time punch / attendance endpoint
app.post('/api/attendance/punch', (req, res) => {
  const { employeeId, employeeName, action, location } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

  let record = crmStore.attendance.find(
    (a) => a.employeeId === employeeId && a.date === today
  );

  if (action === 'in') {
    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName,
        date: today,
        punchInTime: nowTime,
        status: 'Present',
        location: location || 'Mobile GPS Verified',
        verified: true,
      };
      crmStore.attendance.unshift(record);
    }
    // Update employee status to On Duty
    const empIdx = crmStore.employees.findIndex((e) => e.id === employeeId);
    if (empIdx !== -1) {
      crmStore.employees[empIdx].status = 'On Duty';
    }
  } else if (action === 'out' && record) {
    record.punchOutTime = nowTime;
    const empIdx = crmStore.employees.findIndex((e) => e.id === employeeId);
    if (empIdx !== -1) {
      crmStore.employees[empIdx].status = 'Offline';
    }
  }

  persistStore();
  res.json({ success: true, record });
});

// Live status endpoint for desktop admin real-time telemetry
app.get('/api/live-status', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = crmStore.callLogs.filter((c) => {
    return c.timestamp?.startsWith(today) || c.callStart;
  });

  const onCallAgents = crmStore.employees.filter((e) => e.status === 'On Call');
  const onDutyAgents = crmStore.employees.filter((e) => e.status === 'On Duty');
  const onBreakAgents = crmStore.employees.filter((e) => e.status === 'On Break');

  res.json({
    totalCallsToday: todayCalls.length,
    connectedCallsToday: todayCalls.filter((c) => (c.durationSeconds || 0) > 0).length,
    onCallCount: onCallAgents.length,
    onDutyCount: onDutyAgents.length,
    onBreakCount: onBreakAgents.length,
    lastUpdated: crmStore.lastUpdated,
  });
});

// Reset data endpoint
app.post('/api/reset', (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
  crmStore = {
    employees: [],
    leads: [],
    attendance: [],
    breaks: [],
    files: [],
    callLogs: [],
    leaves: [],
    queues: [],
    lastUpdated: new Date().toISOString(),
  };
  res.json({ success: true, message: 'Server data reset' });
});

// Setup Vite or Static File serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CRM Server] Production-ready connected server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
