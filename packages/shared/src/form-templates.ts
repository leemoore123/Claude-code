// All PPM & service form definitions, data-driven (FormSchema).
// These seed FormTemplate rows and drive the on-screen renderer + PDF export.
// Keyed by (assetType, jobType, ppmScope). Admins can clone/revise in-app.

import type { FormSchema, FormSection } from './form-schema.js';

const jobMeta: FormSection = {
  title: 'Job & Site Details',
  fields: [
    { key: 'report_no', label: 'Report No.', type: 'text', required: true },
    { key: 'site', label: 'Site / Vessel', type: 'text', required: true },
    { key: 'asset_tag', label: 'Asset Tag / Ref', type: 'text', required: true },
    { key: 'visit_date', label: 'Visit Date', type: 'date', required: true },
    { key: 'engineer', label: 'Attending Engineer', type: 'text', required: true },
  ],
};

const observationsSection: FormSection = {
  title: 'Observations & Outcome',
  fields: [
    { key: 'defects', label: 'Defects / Faults Found', type: 'textarea' },
    { key: 'actions', label: 'Actions Taken', type: 'textarea' },
    { key: 'recommendations', label: 'Recommendations / Follow-up', type: 'textarea' },
    { key: 'parts_used', label: 'Parts Used', type: 'textarea' },
    { key: 'photos', label: 'Photographs', type: 'attachment', multiple: true },
    {
      key: 'overall_status',
      label: 'Overall Asset Status',
      type: 'select',
      required: true,
      options: ['Operational', 'Operational with defects', 'Failed / Off-line'],
    },
  ],
};

const signoffSection: FormSection = {
  title: 'Sign-off',
  fields: [
    { key: 'engineer_sig', label: 'Engineer Signature', type: 'signature', required: true },
    { key: 'client_name', label: 'Client Representative', type: 'text' },
    { key: 'client_sig', label: 'Client Signature', type: 'signature' },
  ],
};

// ── CHILLER — 6 MONTH PPM ─────────────────────────────────────────────────────
export const chillerPpm6m: FormSchema = {
  key: 'chiller_ppm_6m',
  title: 'Chiller PPM — 6 Monthly',
  assetType: 'chiller',
  jobType: 'ppm',
  ppmScope: 'six_month',
  requiresSignoff: true,
  sections: [
    jobMeta,
    {
      title: 'Electrical',
      fields: [
        { key: 'supply_v_l1', label: 'Supply Voltage L1-L2', type: 'reading', unit: 'V', min: 380, max: 420 },
        { key: 'supply_v_l2', label: 'Supply Voltage L2-L3', type: 'reading', unit: 'V', min: 380, max: 420 },
        { key: 'supply_v_l3', label: 'Supply Voltage L3-L1', type: 'reading', unit: 'V', min: 380, max: 420 },
        { key: 'comp1_current', label: 'Compressor 1 Running Current', type: 'reading', unit: 'A' },
        { key: 'comp2_current', label: 'Compressor 2 Running Current', type: 'reading', unit: 'A' },
        { key: 'terminals_check', label: 'Terminals / Connections Tightened', type: 'select', options: ['OK', 'Adjusted', 'N/A'] },
        { key: 'contactors', label: 'Contactors Inspected', type: 'select', options: ['OK', 'Fault', 'N/A'] },
      ],
    },
    {
      title: 'Refrigeration Circuit',
      fields: [
        { key: 'suction_pressure', label: 'Suction Pressure', type: 'reading', unit: 'bar' },
        { key: 'discharge_pressure', label: 'Discharge Pressure', type: 'reading', unit: 'bar' },
        { key: 'superheat', label: 'Superheat', type: 'reading', unit: 'K' },
        { key: 'subcooling', label: 'Subcooling', type: 'reading', unit: 'K' },
        { key: 'leak_check', label: 'Refrigerant Leak Check', type: 'select', required: true, options: ['Pass', 'Leak found', 'N/A'] },
        { key: 'sight_glass', label: 'Sight Glass Condition', type: 'select', options: ['Clear', 'Bubbles', 'Moisture'] },
      ],
    },
    {
      title: 'Water / Condenser Side',
      fields: [
        { key: 'evap_in', label: 'Evaporator Water In', type: 'reading', unit: '°C' },
        { key: 'evap_out', label: 'Evaporator Water Out', type: 'reading', unit: '°C' },
        { key: 'cond_in', label: 'Condenser In', type: 'reading', unit: '°C' },
        { key: 'cond_out', label: 'Condenser Out', type: 'reading', unit: '°C' },
        { key: 'flow_switch', label: 'Flow Switch Operation', type: 'select', options: ['OK', 'Fault'] },
        { key: 'strainers', label: 'Strainers Cleaned', type: 'checkbox' },
      ],
    },
    {
      title: 'Controls & Safety',
      fields: [
        { key: 'hp_cutout', label: 'HP Cut-out Tested', type: 'checkbox' },
        { key: 'lp_cutout', label: 'LP Cut-out Tested', type: 'checkbox' },
        { key: 'alarms_log', label: 'Controller Alarm Log Reviewed', type: 'checkbox' },
        { key: 'active_alarms', label: 'Active Alarms', type: 'textarea' },
      ],
    },
    observationsSection,
    signoffSection,
  ],
};

// ── CHILLER — 1 YEAR PPM (extends 6M with annual tasks) ───────────────────────
export const chillerPpm1y: FormSchema = {
  ...chillerPpm6m,
  key: 'chiller_ppm_1y',
  title: 'Chiller PPM — Annual',
  ppmScope: 'one_year',
  sections: [
    jobMeta,
    ...chillerPpm6m.sections.slice(1, 5),
    {
      title: 'Annual Tasks',
      fields: [
        { key: 'oil_analysis', label: 'Compressor Oil Analysis', type: 'select', options: ['Sampled', 'Changed', 'N/A'] },
        { key: 'oil_acidity', label: 'Oil Acidity Test', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
        { key: 'condenser_clean', label: 'Condenser Coil / Tubes Cleaned', type: 'checkbox' },
        { key: 'vibration', label: 'Vibration Check', type: 'select', options: ['Normal', 'Elevated'] },
        { key: 'insulation_test', label: 'Motor Insulation (Megger)', type: 'reading', unit: 'MΩ' },
        { key: 'thermography', label: 'Electrical Thermography Done', type: 'checkbox' },
      ],
    },
    observationsSection,
    signoffSection,
  ],
};

// ── CHILLER — 3 YEAR PPM (major service) ──────────────────────────────────────
export const chillerPpm3y: FormSchema = {
  ...chillerPpm6m,
  key: 'chiller_ppm_3y',
  title: 'Chiller PPM — 3 Yearly (Major)',
  ppmScope: 'three_year',
  sections: [
    jobMeta,
    ...chillerPpm1y.sections.slice(1, 6),
    {
      title: '3-Yearly Major Tasks',
      fields: [
        { key: 'eev_service', label: 'EXV / EEV Serviced', type: 'checkbox' },
        { key: 'sensor_calibration', label: 'Sensors Calibrated', type: 'checkbox' },
        { key: 'contactor_replace', label: 'Contactors Replaced (life-expired)', type: 'select', options: ['Replaced', 'Not required'] },
        { key: 'refrigerant_recover', label: 'Refrigerant Recovered & Recharged', type: 'select', options: ['Done', 'N/A'] },
        { key: 'eeprom_backup', label: 'Controller Config Backed Up', type: 'checkbox' },
      ],
    },
    observationsSection,
    signoffSection,
  ],
};

// ── CRAC / CRAH — PPM ─────────────────────────────────────────────────────────
export const cracPpm: FormSchema = {
  key: 'crac_ppm',
  title: 'CRAC / CRAH PPM',
  assetType: 'crac',
  jobType: 'ppm',
  ppmScope: 'six_month',
  requiresSignoff: true,
  sections: [
    jobMeta,
    {
      title: 'Air Side',
      fields: [
        { key: 'return_temp', label: 'Return Air Temp', type: 'reading', unit: '°C' },
        { key: 'supply_temp', label: 'Supply Air Temp', type: 'reading', unit: '°C' },
        { key: 'return_rh', label: 'Return Air Humidity', type: 'reading', unit: '%RH' },
        { key: 'filters', label: 'Filters', type: 'select', required: true, options: ['Clean', 'Cleaned', 'Replaced'] },
        { key: 'dp_filter', label: 'Filter Differential Pressure', type: 'reading', unit: 'Pa' },
        { key: 'fan_condition', label: 'EC Fan / Belt Condition', type: 'select', options: ['OK', 'Fault'] },
      ],
    },
    {
      title: 'Cooling & Humidification',
      fields: [
        { key: 'cooling_valve', label: 'Chilled Water Valve Operation', type: 'select', options: ['OK', 'Fault', 'N/A'] },
        { key: 'humidifier', label: 'Humidifier Operation', type: 'select', options: ['OK', 'Cleaned', 'Fault', 'N/A'] },
        { key: 'condensate', label: 'Condensate Drain / Pump Clear', type: 'checkbox' },
        { key: 'reheat', label: 'Electric Reheat Test', type: 'select', options: ['OK', 'Fault', 'N/A'] },
      ],
    },
    {
      title: 'Electrical & Controls',
      fields: [
        { key: 'supply_v', label: 'Supply Voltage', type: 'reading', unit: 'V' },
        { key: 'fan_current', label: 'Fan Running Current', type: 'reading', unit: 'A' },
        { key: 'alarms', label: 'Controller Alarms Reviewed', type: 'checkbox' },
        { key: 'teamwork_mode', label: 'Teamwork / Standby Rotation OK', type: 'select', options: ['OK', 'Fault', 'N/A'] },
      ],
    },
    observationsSection,
    signoffSection,
  ],
};

// ── FAN WALL — PPM ────────────────────────────────────────────────────────────
export const fanWallPpm: FormSchema = {
  key: 'fan_wall_ppm',
  title: 'Fan Wall PPM',
  assetType: 'fan_wall',
  jobType: 'ppm',
  ppmScope: 'six_month',
  requiresSignoff: true,
  sections: [
    jobMeta,
    {
      title: 'Fan Array',
      fields: [
        { key: 'fans_total', label: 'Total Fans in Array', type: 'number' },
        { key: 'fans_running', label: 'Fans Running OK', type: 'number' },
        { key: 'fans_faulty', label: 'Faulty / Failed Fans (refs)', type: 'textarea' },
        { key: 'vibration', label: 'Vibration / Noise Check', type: 'select', options: ['Normal', 'Elevated'] },
        { key: 'guards', label: 'Guards / Mountings Secure', type: 'checkbox' },
      ],
    },
    {
      title: 'Electrical',
      fields: [
        { key: 'supply_v', label: 'Supply Voltage', type: 'reading', unit: 'V' },
        { key: 'array_current', label: 'Total Array Current', type: 'reading', unit: 'A' },
        { key: 'vfd_status', label: 'VFD / EC Drive Status', type: 'select', options: ['OK', 'Fault'] },
        { key: 'speed_signal', label: 'Speed Reference Signal', type: 'reading', unit: '%' },
        { key: 'thermography', label: 'Electrical Thermography', type: 'select', options: ['Done', 'N/A'] },
      ],
    },
    {
      title: 'Airflow & Controls',
      fields: [
        { key: 'dp_across', label: 'Differential Pressure Across Wall', type: 'reading', unit: 'Pa' },
        { key: 'redundancy', label: 'N+1 Redundancy Verified', type: 'checkbox' },
        { key: 'bms_status', label: 'BMS Status / Alarms', type: 'textarea' },
      ],
    },
    observationsSection,
    signoffSection,
  ],
};

// ── SERVICE / CORRECTIVE REPORT ───────────────────────────────────────────────
export const serviceReport: FormSchema = {
  key: 'service_corrective',
  title: 'Service / Corrective Report',
  jobType: 'corrective',
  requiresSignoff: true,
  sections: [
    {
      title: 'Call Details',
      fields: [
        { key: 'report_no', label: 'Report No.', type: 'text', required: true },
        { key: 'site', label: 'Site / Vessel', type: 'text', required: true },
        { key: 'asset_tag', label: 'Asset Tag / Ref', type: 'text' },
        { key: 'visit_date', label: 'Attendance Date', type: 'date', required: true },
        { key: 'engineer', label: 'Attending Engineer', type: 'text', required: true },
        {
          key: 'call_type',
          label: 'Call Type',
          type: 'select',
          required: true,
          options: ['Breakdown', 'Reactive', 'Warranty', 'Remedial', 'Investigation'],
        },
        { key: 'reported_fault', label: 'Reported Fault', type: 'textarea', required: true },
      ],
    },
    {
      title: 'Diagnosis',
      fields: [
        { key: 'findings', label: 'Findings on Site', type: 'textarea', required: true },
        { key: 'root_cause', label: 'Root Cause', type: 'textarea' },
        { key: 'fault_codes', label: 'Controller Fault Codes', type: 'text' },
      ],
    },
    {
      title: 'Work Done',
      fields: [
        { key: 'work_carried_out', label: 'Work Carried Out', type: 'textarea', required: true },
        { key: 'parts_used', label: 'Parts Used', type: 'textarea' },
        { key: 'labour_hours', label: 'Labour Hours', type: 'reading', unit: 'h' },
        {
          key: 'outcome',
          label: 'Outcome',
          type: 'select',
          required: true,
          options: ['Rectified', 'Temporary fix', 'Parts required', 'Further visit needed'],
        },
        { key: 'follow_up', label: 'Follow-up / Recommendations', type: 'textarea' },
        { key: 'photos', label: 'Photographs', type: 'attachment', multiple: true },
      ],
    },
    signoffSection,
  ],
};

export const ALL_FORM_TEMPLATES: FormSchema[] = [
  chillerPpm6m,
  chillerPpm1y,
  chillerPpm3y,
  cracPpm,
  fanWallPpm,
  serviceReport,
];
