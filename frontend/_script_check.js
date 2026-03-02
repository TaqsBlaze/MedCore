
        const { createApp, ref, reactive, computed } = Vue;

        const API_BASE_URL = 'http://localhost:5000/api';

        const apiClient = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        apiClient.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                }
                return Promise.reject(error);
            }
        );

        const parseJwtPayload = (token) => {
            if (!token || typeof token !== 'string') return null;
            const parts = token.split('.');
            if (parts.length < 2) return null;

            try {
                const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const json = decodeURIComponent(atob(base64).split('').map((c) =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join(''));
                return JSON.parse(json);
            } catch (error) {
                console.warn('Failed to decode token payload:', error);
                return null;
            }
        };

        // Icon Components
        const Icons = {
            Home: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`
            },
            UserPlus: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>`
            },
            Calendar: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
            },
            CreditCard: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>`
            },
            Triage: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>`
            },
            Bed: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`
            },
            ClipBoard: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`
            },
            Stethoscope: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`
            },
            Medical: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`
            },
            Box: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`
            },
            Baby: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`
            },
            Moon: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`
            },
            Settings: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`
            },
            Hospital: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`
            },
            UserCircle: {
                template: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            }
        };

        createApp({
            components: Icons,
            setup() {
                const user = ref(null);
                const currentPage = ref('overview');
                const authView = ref('login');
                const loginForm = reactive({ email: '', password: '' });
                const signupForm = reactive({
                    firstName: '',
                    lastName: '',
                    email: '',
                    role: '',
                    password: ''
                });
                const searchQuery = ref('');
                const showAppointmentForm = ref(false);
                const appointmentFilter = ref('all');
                const paymentFilter = ref('all');
                const patientSearchResults = ref([]);

                // Queue Management State
                const showAddToQueueForm = ref(false);
                const queuePatientSearchResults = ref([]);
                const queueDepartmentFilter = ref('all');
                const queueStatusFilter = ref('all');
                const queuePriorityFilter = ref('all');

                const queueForm = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    department: '',
                    priority: 'Normal',
                    reason: ''
                });

                const queueItems = ref([]);

                const showTriageForm = ref(false);
                const showWardForm = ref(false);
                const triagePatientSearchResults = ref([]);
                const wardPatientSearchResults = ref([]);
                const selectedWardFilter = ref('all');
                const profileSearch = ref('');
                const profileSearchResults = ref([]);
                const selectedProfile = ref(null);
                const editingProfile = ref(false);

                // Triage Data
                const newTriage = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    bpSystolic: '',
                    bpDiastolic: '',
                    temperature: '',
                    pulse: '',
                    respiratoryRate: '',
                    weight: '',
                    height: '',
                    oxygenSaturation: '',
                    bloodSugar: '',
                    priority: 'Standard',
                    chiefComplaint: '',
                    symptoms: '',
                    notes: ''
                });

                const triageRecords = ref([
                    {
                        id: 1,
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        bpSystolic: 120,
                        bpDiastolic: 80,
                        temperature: 36.5,
                        pulse: 72,
                        respiratoryRate: 16,
                        chiefComplaint: 'Headache and fever',
                        priority: 'Semi-Urgent',
                        timestamp: '2026-02-02 08:30'
                    }
                ]);

                // Ward Data
                const newWardAdmission = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    ward: '',
                    bedNumber: '',
                    admissionDate: '',
                    doctor: '',
                    diagnosis: '',
                    notes: ''
                });

                const wardAdmissions = ref([
                    {
                        id: 1,
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        ward: 'General Ward A',
                        bedNumber: 'A-101',
                        diagnosis: 'Pneumonia',
                        admissionDate: '2026-02-01 14:00',
                        doctor: 'Dr. Chikwava'
                    }
                ]);

                // Bed Data
                const beds = ref([
                    { id: 1, number: 'A-101', ward: 'General Ward A', status: 'occupied', patientName: 'John Moyo', patientId: '63-123456A63' },
                    { id: 2, number: 'A-102', ward: 'General Ward A', status: 'vacant', patientName: '', patientId: '' },
                    { id: 3, number: 'A-103', ward: 'General Ward A', status: 'cleaning', patientName: '', patientId: '' },
                    { id: 4, number: 'B-101', ward: 'General Ward B', status: 'vacant', patientName: '', patientId: '' },
                    { id: 5, number: 'B-102', ward: 'General Ward B', status: 'occupied', patientName: 'Sarah Dube', patientId: '85-654321B85' },
                    { id: 6, number: 'ICU-01', ward: 'ICU', status: 'vacant', patientName: '', patientId: '' },
                    { id: 7, number: 'ICU-02', ward: 'ICU', status: 'occupied', patientName: 'Peter Ncube', patientId: '72-987654C72' },
                    { id: 8, number: 'M-101', ward: 'Maternity Ward', status: 'vacant', patientName: '', patientId: '' },
                    { id: 9, number: 'P-101', ward: 'Pediatric Ward', status: 'cleaning', patientName: '', patientId: '' },
                    { id: 10, number: 'S-101', ward: 'Surgical Ward', status: 'vacant', patientName: '', patientId: '' }
                ]);


                // Patient Data with complete fields
                const newPatient = reactive({
                    idType: 'National ID',
                    nationalId: '',
                    name: '',
                    surname: '',
                    dob: '',
                    phoneNumber: '',
                    address: '',
                    district: '',
                    province: '',
                    skinColor: '',
                    disability: 'Able',
                    bloodGroup: 'O+',
                    nextOfKin: '',
                    nextOfKinPhone: '',
                    nextOfKinAddress: ''
                });

                // Appointment Data
                const newAppointment = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    doctor: '',
                    department: 'General Medicine',
                    date: '',
                    time: '',
                    reason: '',
                    priority: 'Normal',
                    type: 'First Visit'
                });

                // Sample Data
                const patients = ref([
                    { name: 'John', surname: 'Moyo', nationalId: '63-123456A63', phoneNumber: '+263 77 123 4567', category: 'General', waitTime: 12 },
                    { name: 'Sarah', surname: 'Dube', nationalId: '85-654321B85', phoneNumber: '+263 71 234 5678', category: 'Emergency', waitTime: 3 }
                ]);

                const appointments = ref([
                    { id: 1, patientName: 'John Moyo', patientId: '63-123456A63', doctor: 'Dr. Chikwava (General)', date: '2026-02-05', time: '09:00', reason: 'Routine checkup and blood pressure monitoring', priority: 'Normal', status: 'scheduled', department: 'General Medicine', type: 'Follow-up' },
                    { id: 2, patientName: 'Sarah Dube', patientId: '85-654321B85', doctor: 'Dr. Moyo (Pediatrics)', date: '2026-02-05', time: '10:30', reason: 'Child vaccination and development assessment', priority: 'Normal', status: 'scheduled', department: 'Pediatrics', type: 'First Visit' }
                ]);

                const payments = ref([
                    { id: 1, patientName: 'John Moyo', patientId: '63-123456A63', service: 'Consultation', amount: 35, paymentMethod: 'Cash', status: 'complete' },
                    { id: 2, patientName: 'Sarah Dube', patientId: '85-654321B85', service: 'X-Ray', amount: 80, paymentMethod: 'Insurance', status: 'pending' },
                    { id: 3, patientName: 'Peter Ncube', patientId: '72-987654C72', service: 'Lab Tests', amount: 120, paymentMethod: 'Ecocash', status: 'pending' },
                    { id: 4, patientName: 'Mary Khumalo', patientId: '90-456789D90', service: 'Consultation', amount: 35, paymentMethod: 'Medical Aid', status: 'complete' }
                ]);

                // DOCTOR MODULE REACTIVE DATA
                const showConsultationForm = ref(false);
                const showDiagnosisForm = ref(false);
                const showLabOrderForm = ref(false);
                const showDrugOrderForm = ref(false);
                const showAdmissionForm = ref(false);
                
                const consultationPatientSearchResults = ref([]);
                const diagnosisPatientSearchResults = ref([]);
                const labOrderPatientSearchResults = ref([]);
                const drugOrderPatientSearchResults = ref([]);
                const admissionPatientSearchResults = ref([]);

                // Consultation Data
                const newConsultation = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    chiefComplaint: '',
                    symptomDuration: '',
                    severity: '',
                    historyPresent: '',
                    associatedSymptoms: '',
                    previousIllnesses: '',
                    surgicalHistory: '',
                    currentMedications: '',
                    allergies: '',
                    examination: {
                        bp: '',
                        heartRate: '',
                        temperature: '',
                        respiratoryRate: '',
                        spo2: '',
                        weight: '',
                        findings: ''
                    },
                    workingDiagnosis: '',
                    clinicalNotes: ''
                });

                const consultations = ref([
                    {
                        id: 1,
                        time: '09:30',
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        chiefComplaint: 'Persistent headache with dizziness for 3 days',
                        severity: 'Moderate',
                        status: 'completed'
                    },
                    {
                        id: 2,
                        time: '10:15',
                        patientName: 'Sarah Dube',
                        patientId: '85-654321B85',
                        chiefComplaint: 'Chest pain and difficulty breathing',
                        severity: 'Severe',
                        status: 'in-progress'
                    },
                    {
                        id: 3,
                        time: '11:00',
                        patientName: 'Peter Ncube',
                        patientId: '72-987654C72',
                        chiefComplaint: 'Fever and general body weakness',
                        severity: 'Mild',
                        status: 'waiting'
                    }
                ]);

                // Diagnosis Data
                const newDiagnosis = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    primaryDiagnosis: '',
                    icdCode: '',
                    secondaryDiagnosis: '',
                    diagnosisType: '',
                    severity: '',
                    clinicalAssessment: '',
                    supportingEvidence: '',
                    additionalNotes: '',
                    treatmentPlan: '',
                    prognosis: '',
                    followUpInstructions: ''
                });

                const diagnosisRecords = ref([
                    {
                        id: 1,
                        date: '2026-02-08',
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        primaryDiagnosis: 'Tension-type headache with possible migraine component',
                        diagnosisType: 'Confirmed',
                        severity: 'Moderate'
                    },
                    {
                        id: 2,
                        date: '2026-02-08',
                        patientName: 'Sarah Dube',
                        patientId: '85-654321B85',
                        primaryDiagnosis: 'Acute bronchitis with respiratory distress',
                        diagnosisType: 'Provisional',
                        severity: 'Severe'
                    }
                ]);

                // Lab Orders Data
                const newLabOrder = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    testCategory: '',
                    testsOrdered: '',
                    priority: '',
                    expectedDate: '',
                    clinicalIndication: '',
                    provisionalDiagnosis: '',
                    specialInstructions: ''
                });

                const labOrders = ref([
                    {
                        id: 1,
                        date: '2026-02-08',
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        testsOrdered: 'Complete Blood Count (CBC), Liver Function Test',
                        priority: 'Routine',
                        status: 'pending'
                    },
                    {
                        id: 2,
                        date: '2026-02-08',
                        patientName: 'Sarah Dube',
                        patientId: '85-654321B85',
                        testsOrdered: 'Chest X-Ray, Sputum Culture',
                        priority: 'Urgent',
                        status: 'in-progress'
                    },
                    {
                        id: 3,
                        date: '2026-02-07',
                        patientName: 'Peter Ncube',
                        patientId: '72-987654C72',
                        testsOrdered: 'Malaria Rapid Test, Blood Film',
                        priority: 'STAT',
                        status: 'completed'
                    }
                ]);

                // Drug Orders Data
                const newDrugOrder = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    drugName: '',
                    strength: '',
                    form: '',
                    route: '',
                    frequency: '',
                    duration: '',
                    quantity: '',
                    instructions: '',
                    indication: '',
                    refillable: false,
                    refills: 0,
                    precautions: ''
                });

                const drugOrders = ref([
                    {
                        id: 1,
                        date: '2026-02-08',
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        drugName: 'Paracetamol',
                        strength: '500mg',
                        frequency: 'Three times daily',
                        duration: '5 days',
                        quantity: 30,
                        indication: 'Headache and fever management',
                        prescribingDoctor: 'Chikwava (General)',
                        refillable: false,
                        refills: 0,
                        status: 'active',
                        rxStatus: 'active'
                    },
                    {
                        id: 2,
                        date: '2026-02-08',
                        patientName: 'Sarah Dube',
                        patientId: '85-654321B85',
                        drugName: 'Amoxicillin',
                        strength: '500mg',
                        frequency: 'Three times daily',
                        duration: '7 days',
                        quantity: 21,
                        indication: 'Acute bronchitis — antibiotic cover',
                        prescribingDoctor: 'Moyo (Pediatrics)',
                        refillable: false,
                        refills: 0,
                        status: 'dispensed',
                        rxStatus: 'dispensed'
                    },
                    {
                        id: 3,
                        date: '2026-02-07',
                        patientName: 'Peter Ncube',
                        patientId: '72-987654C72',
                        drugName: 'Artemether-Lumefantrine',
                        strength: '80/480mg',
                        frequency: 'Twice daily',
                        duration: '3 days',
                        quantity: 24,
                        indication: 'Confirmed uncomplicated malaria',
                        prescribingDoctor: 'Chikwava (General)',
                        refillable: false,
                        refills: 0,
                        status: 'completed',
                        rxStatus: 'verified'
                    }
                ]);

                // Admission Data
                const newAdmission = reactive({
                    patientSearch: '',
                    patientName: '',
                    patientId: '',
                    admissionDateTime: '',
                    admissionType: '',
                    ward: '',
                    bedNumber: '',
                    reasonForAdmission: '',
                    admittingDiagnosis: '',
                    attendingPhysician: '',
                    expectedDuration: '',
                    severity: '',
                    treatmentPlan: '',
                    specialInstructions: ''
                });

                const admissionRecords = ref([
                    {
                        id: 1,
                        admissionDate: '2026-02-06',
                        patientName: 'John Moyo',
                        patientId: '63-123456A63',
                        ward: 'General Ward A',
                        bedNumber: 'A-105',
                        admittingDiagnosis: 'Severe dehydration with electrolyte imbalance',
                        severity: 'Serious',
                        status: 'admitted'
                    },
                    {
                        id: 2,
                        admissionDate: '2026-02-05',
                        patientName: 'Sarah Dube',
                        patientId: '85-654321B85',
                        ward: 'ICU',
                        bedNumber: 'ICU-03',
                        admittingDiagnosis: 'Acute respiratory distress syndrome',
                        severity: 'Critical',
                        status: 'admitted'
                    },
                    {
                        id: 3,
                        admissionDate: '2026-02-03',
                        patientName: 'Mary Khumalo',
                        patientId: '91-456789D91',
                        ward: 'Surgical Ward',
                        bedNumber: 'S-102',
                        admittingDiagnosis: 'Post-operative appendectomy',
                        severity: 'Stable',
                        status: 'pending-discharge'
                    }
                ]);

                // ===== PHARMACIST DATA =====

                // Inventory State
                const showInventoryForm = ref(false);
                const inventoryEditingItem = ref(null);
                const inventorySearchQuery = ref('');
                const inventoryCategoryFilter = ref('all');

                const newInventoryItem = reactive({
                    itemCode: '', name: '', genericName: '', category: '', form: '',
                    strength: '', manufacturer: '', supplier: '', batchNumber: '',
                    manufactureDate: '', expiryDate: '', registrationNumber: '',
                    unit: '', stockQuantity: '', reorderLevel: '', maxStockLevel: '',
                    unitCost: '', sellingPrice: '', packSize: '', shelfLocation: '',
                    storageCondition: '', schedule: '', controlledSubstance: false, notes: ''
                });

                const inventoryItems = ref([
                    {
                        itemCode: 'MED-0001', name: 'Panadol', genericName: 'Paracetamol',
                        category: 'Analgesics / Antipyretics', form: 'Tablet', strength: '500mg',
                        manufacturer: 'CAPS Pharma', supplier: 'NatPharm Zimbabwe',
                        batchNumber: 'BN-2025-0041', manufactureDate: '2025-01-01', expiryDate: '2027-01-31',
                        registrationNumber: 'MCAZ-001', unit: 'Tablet(s)', stockQuantity: 500,
                        reorderLevel: 100, maxStockLevel: 1000, unitCost: 0.05, sellingPrice: 0.12,
                        packSize: '100 tabs/box', shelfLocation: 'Row A - Shelf 1',
                        storageCondition: 'Room Temperature (15–25°C)', schedule: '', controlledSubstance: false, notes: ''
                    },
                    {
                        itemCode: 'MED-0002', name: 'Amoxil', genericName: 'Amoxicillin',
                        category: 'Antibiotics', form: 'Capsule', strength: '500mg',
                        manufacturer: 'Varichem Pharmaceuticals', supplier: 'NatPharm Zimbabwe',
                        batchNumber: 'BN-2025-0088', manufactureDate: '2025-03-01', expiryDate: '2027-03-31',
                        registrationNumber: 'MCAZ-042', unit: 'Capsule(s)', stockQuantity: 80,
                        reorderLevel: 100, maxStockLevel: 800, unitCost: 0.18, sellingPrice: 0.45,
                        packSize: '500 caps/box', shelfLocation: 'Row A - Shelf 2',
                        storageCondition: 'Room Temperature (15–25°C)', schedule: 'Schedule II (Prescription Only)', controlledSubstance: false,
                        notes: 'Prescription required. Check for penicillin allergy before dispensing.'
                    },
                    {
                        itemCode: 'MED-0003', name: 'Coartem', genericName: 'Artemether-Lumefantrine',
                        category: 'Antiparasitics / Antimalarials', form: 'Tablet', strength: '80/480mg',
                        manufacturer: 'Novartis', supplier: 'Crown Agents',
                        batchNumber: 'BN-2025-0112', manufactureDate: '2025-02-15', expiryDate: '2026-04-30',
                        registrationNumber: 'MCAZ-108', unit: 'Tablet(s)', stockQuantity: 24,
                        reorderLevel: 50, maxStockLevel: 300, unitCost: 1.20, sellingPrice: 2.80,
                        packSize: '24 tabs/pack', shelfLocation: 'Row B - Shelf 1',
                        storageCondition: 'Room Temperature (15–25°C)', schedule: 'Schedule II (Prescription Only)', controlledSubstance: false,
                        notes: 'Weight-based dosing. 6-tab pack for 10–15 kg, 12-tab for 16–24 kg.'
                    },
                    {
                        itemCode: 'MED-0004', name: 'Ringers Lactate', genericName: 'Lactated Ringer\'s Solution',
                        category: 'IV Fluids / Infusions', form: 'IV Fluid / Infusion Bag', strength: '500ml',
                        manufacturer: 'CAPS Pharma', supplier: 'NatPharm Zimbabwe',
                        batchNumber: 'BN-2025-0190', manufactureDate: '2025-04-01', expiryDate: '2027-04-30',
                        registrationNumber: 'MCAZ-200', unit: 'Bag(s)', stockQuantity: 0,
                        reorderLevel: 20, maxStockLevel: 100, unitCost: 2.50, sellingPrice: 5.00,
                        packSize: '12 bags/carton', shelfLocation: 'Store Room B',
                        storageCondition: 'Room Temperature (15–25°C)', schedule: '', controlledSubstance: false,
                        notes: 'Out of stock – requisition raised 2026-02-10.'
                    },
                    {
                        itemCode: 'MED-0005', name: 'Pethidine Injection', genericName: 'Meperidine HCl',
                        category: 'Analgesics / Antipyretics', form: 'Injection (IM)', strength: '100mg/2ml',
                        manufacturer: 'Rotexmedica', supplier: 'Medibis',
                        batchNumber: 'BN-2025-0033', manufactureDate: '2024-12-01', expiryDate: '2026-03-15',
                        registrationNumber: 'MCAZ-305', unit: 'Ampoule(s)', stockQuantity: 15,
                        reorderLevel: 10, maxStockLevel: 50, unitCost: 3.80, sellingPrice: 8.00,
                        packSize: '10 amps/box', shelfLocation: 'Controlled Drugs Cabinet',
                        storageCondition: 'Room Temperature (15–25°C)', schedule: 'Schedule II (Prescription Only)', controlledSubstance: true,
                        notes: 'CONTROLLED SUBSTANCE – Double-sign required on dispensation. Log all transactions.'
                    }
                ]);

                // Dispensing State
                const showDispenseForm = ref(false);
                const dispensePatientSearchResults = ref([]);
                const dispenseTypeFilter = ref('all');

                const newDispensation = reactive({
                    patientSearch: '', patientName: '', patientId: '',
                    type: 'OTC', prescriptionRef: '', prescribingDoctor: '',
                    knownAllergies: '', counsellingProvided: 'yes',
                    paymentMethod: '', medicalAidScheme: '',
                    pharmacistNotes: ''
                });

                const dispenseCartItem = reactive({
                    medicationId: '', medicationName: '', genericName: '',
                    strength: '', form: '', unit: '', batchNumber: '',
                    sellingPrice: 0, quantity: 1, instructions: ''
                });

                const dispenseCart = ref([]);

                const dispensationRecords = ref([
                    {
                        id: 1, date: '2026-02-15', time: '09:12',
                        patientName: 'John Moyo', patientId: '63-123456A63',
                        type: 'Prescription',
                        itemsSummary: 'Panadol 500mg x30, Amoxil 500mg x21',
                        paymentMethod: 'Cash (USD)', totalAmount: 13.05,
                        dispensedBy: 'Pharm. Ndlovu'
                    },
                    {
                        id: 2, date: '2026-02-15', time: '10:45',
                        patientName: 'Sarah Dube', patientId: '85-654321B85',
                        type: 'OTC',
                        itemsSummary: 'Panadol 500mg x20',
                        paymentMethod: 'EcoCash', totalAmount: 2.40,
                        dispensedBy: 'Pharm. Ndlovu'
                    },
                    {
                        id: 3, date: '2026-02-14', time: '14:30',
                        patientName: 'Peter Ncube', patientId: '72-987654C72',
                        type: 'Prescription',
                        itemsSummary: 'Coartem 80/480mg x24',
                        paymentMethod: 'Medical Aid / Insurance', totalAmount: 67.20,
                        dispensedBy: 'Pharm. Ncube'
                    }
                ]);

                const todayDate = new Date().toISOString().slice(0, 10);

                // Prescriptions State
                const selectedPrescription = ref(null);
                const rxReviewNote = ref('');
                const rxStatusFilter = ref('all');
                const rxSearchQuery = ref('');

                // Computed
                const menuItems = computed(() => {
                    if (!user.value) return [];
                    const base = [{ id: 'overview', label: 'Dashboard', icon: Icons.Home }];
                    const roles = {
                        Receptionist: [
                            { id: 'registration', label: 'Patient Registration', icon: Icons.UserPlus },
                            { id: 'appointments', label: 'Appointments', icon: Icons.Calendar },
                            { id: 'payments', label: 'Payments', icon: Icons.CreditCard },
                            { id: 'queue', label: 'Queue Management', icon: Icons.Triage }
                        ],
                        Nurse: [
                            { id: 'triage', label: 'Triage & Vitals', icon: Icons.Triage },
                            { id: 'ward', label: 'Ward Management', icon: Icons.Bed },
                            { id: 'bed-status', label: 'Bed Status', icon: Icons.Hospital },
                            { id: 'profile', label: 'Profile Maintenance', icon: Icons.UserCircle }
                        ],
                        Doctor: [
                            { id: 'consultation', label: 'Consultations', icon: Icons.Stethoscope },
                            { id: 'diagnosis', label: 'Diagnosis & Notes', icon: Icons.ClipBoard },
                            { id: 'orders', label: 'Lab & Drug Orders', icon: Icons.Medical },
                            { id: 'admissions', label: 'Admissions/Discharge', icon: Icons.UserPlus }
                        ],
                        Pharmacist: [
                            { id: 'inventory', label: 'Stock Inventory', icon: Icons.Box },
                            { id: 'dispensing', label: 'Dispense Meds', icon: Icons.Medical },
                            { id: 'prescriptions', label: 'Prescriptions', icon: Icons.ClipBoard }
                        ],
                    };
                    return [...base, ...(roles[user.value.role] || [])];
                });

                const roleActions = computed(() => {
                    if (!user.value) return [];
                    const actions = {
                        Receptionist: [
                            { id: 'registration', label: 'New Patient', icon: Icons.UserPlus },
                            { id: 'appointments', label: 'Book Slot', icon: Icons.Calendar },
                            { id: 'lookup', label: 'Rapid Lookup', icon: Icons.Triage }
                        ],
                        Nurse: [
                            { id: 'triage', label: 'New Triage', icon: Icons.Triage },
                            { id: 'vitals', label: 'Record Vitals', icon: Icons.ClipBoard },
                            { id: 'bed-update', label: 'Update Bed', icon: Icons.Bed }
                        ],
                        Doctor: [
                            { id: 'consult', label: 'Next Consult', icon: Icons.Stethoscope },
                            { id: 'diagnosis', label: 'Write Diagnosis', icon: Icons.ClipBoard },
                            { id: 'order', label: 'Order Test', icon: Icons.Medical }
                        ],
                        Pharmacist: [
                            { id: 'dispense', label: 'Dispense Item', icon: Icons.Medical },
                            { id: 'stock-check', label: 'Stock Audit', icon: Icons.Box }
                        ],
                    };
                    return actions[user.value.role] || [];
                });

                const filteredAppointments = computed(() => {
                    if (appointmentFilter.value === 'all') return appointments.value;
                    return appointments.value.filter(a => a.status === appointmentFilter.value);
                });

                const filteredPayments = computed(() => {
                    if (paymentFilter.value === 'all') return payments.value;
                    return payments.value.filter(p => p.status === paymentFilter.value);
                });

                const paymentStats = computed(() => ({
                    pending: payments.value.filter(p => p.status === 'pending').length,
                    complete: payments.value.filter(p => p.status === 'complete').length,
                    cash: payments.value.filter(p => p.paymentMethod === 'Cash').length,
                    insurance: payments.value.filter(p => p.paymentMethod === 'Insurance').length
                }));

                // ===== PHARMACIST COMPUTED =====
                const lowStockItems = computed(() =>
                    inventoryItems.value.filter(i => i.stockQuantity <= i.reorderLevel)
                );

                const expiringSoonItems = computed(() => {
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() + 60);
                    return inventoryItems.value.filter(i => {
                        if (!i.expiryDate) return false;
                        return new Date(i.expiryDate) <= cutoff;
                    });
                });

                const filteredInventory = computed(() => {
                    return inventoryItems.value.filter(item => {
                        const matchCat = inventoryCategoryFilter.value === 'all' || item.category === inventoryCategoryFilter.value;
                        const q = inventorySearchQuery.value.toLowerCase();
                        const matchSearch = !q || item.name.toLowerCase().includes(q) || item.genericName.toLowerCase().includes(q) || item.itemCode.toLowerCase().includes(q);
                        return matchCat && matchSearch;
                    });
                });

                const dispenseCartTotal = computed(() =>
                    dispenseCart.value.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0)
                );

                const filteredDispensationRecords = computed(() => {
                    if (dispenseTypeFilter.value === 'all') return dispensationRecords.value;
                    return dispensationRecords.value.filter(r => r.type === dispenseTypeFilter.value);
                });

                // Prescriptions Computed
                const pendingPrescriptions = computed(() =>
                    drugOrders.value.filter(rx => rx.rxStatus === 'active')
                );

                const filteredPrescriptions = computed(() => {
                    return drugOrders.value.filter(rx => {
                        const matchStatus = rxStatusFilter.value === 'all' || rx.rxStatus === rxStatusFilter.value;
                        const q = rxSearchQuery.value.toLowerCase();
                        const matchSearch = !q ||
                            rx.patientName.toLowerCase().includes(q) ||
                            rx.drugName.toLowerCase().includes(q) ||
                            (rx.patientId && rx.patientId.toLowerCase().includes(q));
                        return matchStatus && matchSearch;
                    });
                });

                const stats = computed(() => [
                    { label: 'Booked Today', value: appointments.value.length + 8, sync: 'Live' },
                    { label: 'Patient Count', value: '286', sync: 'Live' },
                    { label: 'Wait Avg', value: '14m', sync: 'Live' },
                    { label: 'Staff Count', value: '42', sync: 'Live' }
                ]);

                // Queue Management Computed
                const filteredQueueItems = computed(() => {
                    return queueItems.value.filter(item => {
                        const matchDept = queueDepartmentFilter.value === 'all' || item.department === queueDepartmentFilter.value;
                        const matchStatus = queueStatusFilter.value === 'all' || item.status === queueStatusFilter.value;
                        const matchPriority = queuePriorityFilter.value === 'all' || item.priority === queuePriorityFilter.value;
                        return matchDept && matchStatus && matchPriority;
                    }).sort((a, b) => {
                        // Emergency first, then by wait time
                        if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
                        if (b.priority === 'Emergency' && a.priority !== 'Emergency') return 1;
                        return b.waitTime - a.waitTime;
                    });
                });

                const averageWaitTime = computed(() => {
                    const waiting = queueItems.value.filter(q => q.status === 'waiting' || q.status === 'called');
                    if (waiting.length === 0) return 0;
                    const total = waiting.reduce((sum, item) => sum + item.waitTime, 0);
                    return Math.round(total / waiting.length);
                });

                const longestWait = computed(() => {
                    const waiting = queueItems.value.filter(q => q.status === 'waiting' || q.status === 'called');
                    if (waiting.length === 0) return 0;
                    return Math.max(...waiting.map(item => item.waitTime));
                });

                const nextInQueue = computed(() => {
                    const waiting = queueItems.value
                        .filter(q => q.status === 'waiting')
                        .sort((a, b) => {
                            if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1;
                            if (b.priority === 'Emergency' && a.priority !== 'Emergency') return 1;
                            if (a.priority === 'Urgent' && b.priority === 'Normal') return -1;
                            if (b.priority === 'Urgent' && a.priority === 'Normal') return 1;
                            return b.waitTime - a.waitTime;
                        });
                    return waiting.length > 0 ? waiting[0] : null;
                });

                // Methods
                const handleAction = (id) => {
                    if (id === 'registration') currentPage.value = 'registration';
                    else {
                        const targetPage = menuItems.value.find(item => item.id === id);
                        if (targetPage) currentPage.value = targetPage.id;
                        else console.log(`Action triggered: ${id}`);
                    }
                };

                const savePatient = async () => {
                    try {
                        const response = await apiClient.post('/patients/add', {
                            name: newPatient.name,
                            surname: newPatient.surname,
                            dob: newPatient.dob,
                            nationalId: newPatient.nationalId,
                            phoneNumber: newPatient.phoneNumber,
                            address: newPatient.address,
                            district: newPatient.district,
                            province: newPatient.province,
                            skinColor: newPatient.skinColor,
                            disability: (newPatient.disability || '').toLowerCase(),
                            bloodGroup: newPatient.bloodGroup,
                            nextOfKin: newPatient.nextOfKin,
                            nextOfKinPhone: newPatient.nextOfKinPhone,
                            nextOfKinAddress: newPatient.nextOfKinAddress,
                            dnaScanId: ''
                        });

                        if (response.data.status) {
                            await loadAllData();
                            Object.keys(newPatient).forEach(key => {
                                if (key === 'idType') newPatient[key] = 'National ID';
                                else if (key === 'disability') newPatient[key] = 'Able';
                                else if (key === 'bloodGroup') newPatient[key] = 'O+';
                                else newPatient[key] = '';
                            });
                            alert('Patient registered successfully.');
                        } else {
                            alert('Failed to register patient.');
                        }
                    } catch (error) {
                        console.error('Patient registration error:', error);
                        alert('Failed to register patient.');
                    }
                };


                const searchPatients = () => {
                    const query = newAppointment.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        patientSearchResults.value = [];
                        return;
                    }
                    patientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForAppointment = (patient) => {
                    newAppointment.patientName = `${patient.name} ${patient.surname}`;
                    newAppointment.patientId = patient.id;
                    newAppointment.patientSearch = `${patient.name} ${patient.surname}`;
                    patientSearchResults.value = [];
                };

                const saveAppointment = async () => {
                    try {
                        const response = await apiClient.post('/appointments/add', {
                            patientId: newAppointment.patientId,
                            doctorId: null,
                            department: newAppointment.department,
                            date: newAppointment.date,
                            time: newAppointment.time,
                            reason: newAppointment.reason,
                            priority: newAppointment.priority,
                            type: newAppointment.type
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showAppointmentForm.value = false;
                            Object.keys(newAppointment).forEach(key => newAppointment[key] = '');
                            newAppointment.department = 'General Medicine';
                            newAppointment.priority = 'Normal';
                            newAppointment.type = 'First Visit';
                        } else {
                            alert('Failed to book appointment.');
                        }
                    } catch (error) {
                        console.error('Appointment error:', error);
                        alert('Failed to book appointment.');
                    }
                };


                const updateAppointmentStatus = async (id, status) => {
                    try {
                        const response = await apiClient.put(`/appointments/${id}/status`, { status });
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to update appointment status.');
                        }
                    } catch (error) {
                        console.error('Appointment status update error:', error);
                        alert('Failed to update appointment status.');
                    }
                };

                const updatePaymentStatus = async (id, status) => {
                    try {
                        const payment = payments.value.find(p => p.id === id);
                        const response = await apiClient.put(`/payments/${id}`, {
                            status,
                            paymentMethod: payment ? payment.paymentMethod : undefined
                        });
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to update payment status.');
                        }
                    } catch (error) {
                        console.error('Payment status update error:', error);
                        alert('Failed to update payment status.');
                    }
                };

                const updatePayment = async (id) => {
                    try {
                        const payment = payments.value.find(p => p.id === id);
                        if (!payment) return;

                        const response = await apiClient.put(`/payments/${id}`, {
                            status: payment.status,
                            paymentMethod: payment.paymentMethod
                        });
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to update payment.');
                        }
                    } catch (error) {
                        console.error('Payment update error:', error);
                        alert('Failed to update payment.');
                    }
                };

                // Nurse Functions
                const searchPatientsForTriage = () => {
                    const query = newTriage.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        triagePatientSearchResults.value = [];
                        return;
                    }
                    triagePatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForTriage = (patient) => {
                    newTriage.patientName = `${patient.name} ${patient.surname}`;
                    newTriage.patientId = patient.id;
                    newTriage.patientSearch = `${patient.name} ${patient.surname}`;
                    triagePatientSearchResults.value = [];
                };

                const saveTriageRecord = async () => {
                    try {
                        const response = await apiClient.post('/triage/add', {
                            patientId: newTriage.patientId,
                            bpSystolic: newTriage.bpSystolic,
                            bpDiastolic: newTriage.bpDiastolic,
                            temperature: newTriage.temperature,
                            pulse: newTriage.pulse,
                            respiratoryRate: newTriage.respiratoryRate,
                            weight: newTriage.weight,
                            height: newTriage.height,
                            oxygenSaturation: newTriage.oxygenSaturation,
                            bloodSugar: newTriage.bloodSugar,
                            priority: newTriage.priority,
                            chiefComplaint: newTriage.chiefComplaint,
                            symptoms: newTriage.symptoms,
                            notes: newTriage.notes
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showTriageForm.value = false;
                            Object.keys(newTriage).forEach(key => newTriage[key] = '');
                            newTriage.priority = 'Normal';
                        } else {
                            alert('Failed to save triage record.');
                        }
                    } catch (error) {
                        console.error('Triage error:', error);
                        alert('Failed to save triage record.');
                    }
                };


                const searchPatientsForWard = () => {
                    const query = newWardAdmission.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        wardPatientSearchResults.value = [];
                        return;
                    }
                    wardPatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query)
                    );
                };

                const selectPatientForWard = (patient) => {
                    newWardAdmission.patientName = `${patient.name} ${patient.surname}`;
                    newWardAdmission.patientId = patient.id;
                    newWardAdmission.patientSearch = `${patient.name} ${patient.surname}`;
                    wardPatientSearchResults.value = [];
                };

                const saveWardAdmission = async () => {
                    try {
                        const response = await apiClient.post('/ward/add', {
                            patientId: newWardAdmission.patientId,
                            ward: newWardAdmission.ward,
                            bedNumber: newWardAdmission.bedNumber,
                            admissionDate: newWardAdmission.admissionDate,
                            diagnosis: newWardAdmission.diagnosis,
                            notes: newWardAdmission.notes
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showWardForm.value = false;
                            Object.keys(newWardAdmission).forEach(key => newWardAdmission[key] = '');
                        } else {
                            alert('Failed to admit patient.');
                        }
                    } catch (error) {
                        console.error('Ward admission error:', error);
                        alert('Failed to admit patient.');
                    }
                };


                const dischargePatient = (admissionId) => {
                    const admission = wardAdmissions.value.find(a => a.id === admissionId);
                    if (admission) {
                        // Free up the bed
                        const bed = beds.value.find(b => b.number === admission.bedNumber);
                        if (bed) {
                            bed.status = 'cleaning';
                            bed.patientName = '';
                            bed.patientId = '';
                        }
                        // Remove from ward admissions
                        wardAdmissions.value = wardAdmissions.value.filter(a => a.id !== admissionId);
                    }
                };

                const updateBedStatus = (bedId, status) => {
                    const bed = beds.value.find(b => b.id === bedId);
                    if (bed) {
                        bed.status = status;
                        if (status === 'vacant' || status === 'cleaning') {
                            bed.patientName = '';
                            bed.patientId = '';
                        }
                    }
                };

                const searchPatientProfile = () => {
                    const query = profileSearch.value.toLowerCase();
                    if (query.length < 2) {
                        profileSearchResults.value = [];
                        return;
                    }
                    profileSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientProfile = (patient) => {
                    selectedProfile.value = {
                        ...patient,
                        allergies: 'Penicillin, Peanuts',
                        chronicConditions: 'Hypertension, Type 2 Diabetes',
                        currentMedications: 'Metformin 500mg, Lisinopril 10mg',
                        immunizations: 'COVID-19 (2024), Flu (2025), Tetanus (2023)',
                        latestVitals: {
                            bp: '120/80 mmHg',
                            temp: '36.5°C',
                            pulse: '72 bpm',
                            weight: '70 kg'
                        }
                    };
                    editingProfile.value = false;
                };

                const saveProfileUpdate = async () => {
                    if (!selectedProfile.value) return;
                    try {
                        const response = await apiClient.put(`/patients/${selectedProfile.value.id}/update`, {
                            name: editingProfile.name,
                            surname: editingProfile.surname,
                            phoneNumber: editingProfile.phoneNumber,
                            allergies: editingProfile.allergies,
                            chronicConditions: editingProfile.chronicConditions,
                            currentMedications: editingProfile.currentMedications,
                            immunizations: editingProfile.immunizations
                        });

                        if (response.data.status) {
                            await loadAllData();
                            editingProfile.name = '';
                            editingProfile.surname = '';
                            editingProfile.phoneNumber = '';
                            editingProfile.allergies = '';
                            editingProfile.chronicConditions = '';
                            editingProfile.currentMedications = '';
                            editingProfile.immunizations = '';
                        } else {
                            alert('Failed to update patient profile.');
                        }
                    } catch (error) {
                        console.error('Profile update error:', error);
                        alert('Failed to update patient profile.');
                    }
                };\r\n
                // Computed properties for Nurse modules
                const availableBeds = computed(() => {
                    return beds.value.filter(b => b.status === 'vacant' && b.ward === newWardAdmission.ward);
                });

                const filteredBeds = computed(() => {
                    if (selectedWardFilter.value === 'all') return beds.value;
                    return beds.value.filter(b => b.ward === selectedWardFilter.value);
                });

                const bedStats = computed(() => ({
                    total: beds.value.length,
                    occupied: beds.value.filter(b => b.status === 'occupied').length,
                    available: beds.value.filter(b => b.status === 'vacant').length,
                    cleaning: beds.value.filter(b => b.status === 'cleaning').length
                }));


                // DOCTOR FUNCTIONS
                // Consultation Functions
                const searchPatientsForConsultation = () => {
                    const query = newConsultation.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        consultationPatientSearchResults.value = [];
                        return;
                    }
                    consultationPatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForConsultation = (patient) => {
                    newConsultation.patientName = `${patient.name} ${patient.surname}`;
                    newConsultation.patientId = patient.id;
                    newConsultation.patientSearch = `${patient.name} ${patient.surname}`;
                    consultationPatientSearchResults.value = [];
                };

                const saveConsultation = async () => {
                    try {
                        const response = await apiClient.post('/consultations/add', {
                            patientId: newConsultation.patientId,
                            chiefComplaint: newConsultation.chiefComplaint,
                            symptomDuration: newConsultation.symptomDuration,
                            severity: newConsultation.severity,
                            historyPresent: newConsultation.historyPresent,
                            associatedSymptoms: newConsultation.associatedSymptoms,
                            previousIllnesses: newConsultation.previousIllnesses,
                            surgicalHistory: newConsultation.surgicalHistory,
                            currentMedications: newConsultation.currentMedications,
                            allergies: newConsultation.allergies,
                            examBP: newConsultation.examBP,
                            examHeartRate: newConsultation.examHeartRate,
                            examTemperature: newConsultation.examTemperature,
                            examRespiratoryRate: newConsultation.examRespiratoryRate,
                            examSpO2: newConsultation.examSpO2,
                            examWeight: newConsultation.examWeight,
                            examFindings: newConsultation.examFindings,
                            workingDiagnosis: newConsultation.workingDiagnosis,
                            clinicalNotes: newConsultation.clinicalNotes
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showConsultationForm.value = false;
                            Object.keys(newConsultation).forEach(key => newConsultation[key] = '');
                        } else {
                            alert('Failed to save consultation.');
                        }
                    } catch (error) {
                        console.error('Consultation error:', error);
                        alert('Failed to save consultation.');
                    }
                };


                // Diagnosis Functions
                const searchPatientsForDiagnosis = () => {
                    const query = newDiagnosis.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        diagnosisPatientSearchResults.value = [];
                        return;
                    }
                    diagnosisPatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForDiagnosis = (patient) => {
                    newDiagnosis.patientName = `${patient.name} ${patient.surname}`;
                    newDiagnosis.patientId = patient.id;
                    newDiagnosis.patientSearch = `${patient.name} ${patient.surname}`;
                    diagnosisPatientSearchResults.value = [];
                };

                const saveDiagnosis = async () => {
                    try {
                        const response = await apiClient.post('/diagnoses/add', {
                            patientId: newDiagnosis.patientId,
                            primaryDiagnosis: newDiagnosis.primaryDiagnosis,
                            icdCode: newDiagnosis.icdCode,
                            secondaryDiagnosis: newDiagnosis.secondaryDiagnosis,
                            diagnosisType: newDiagnosis.diagnosisType,
                            severity: newDiagnosis.severity,
                            clinicalAssessment: newDiagnosis.clinicalAssessment,
                            supportingEvidence: newDiagnosis.supportingEvidence,
                            additionalNotes: newDiagnosis.additionalNotes,
                            treatmentPlan: newDiagnosis.treatmentPlan,
                            prognosis: newDiagnosis.prognosis,
                            followUpInstructions: newDiagnosis.followUpInstructions
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showDiagnosisForm.value = false;
                            Object.keys(newDiagnosis).forEach(key => newDiagnosis[key] = '');
                        } else {
                            alert('Failed to save diagnosis.');
                        }
                    } catch (error) {
                        console.error('Diagnosis error:', error);
                        alert('Failed to save diagnosis.');
                    }
                };


                // Lab Order Functions
                const searchPatientsForLabOrder = () => {
                    const query = newLabOrder.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        labOrderPatientSearchResults.value = [];
                        return;
                    }
                    labOrderPatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForLabOrder = (patient) => {
                    newLabOrder.patientName = `${patient.name} ${patient.surname}`;
                    newLabOrder.patientId = patient.id;
                    newLabOrder.patientSearch = `${patient.name} ${patient.surname}`;
                    labOrderPatientSearchResults.value = [];
                };

                const saveLabOrder = async () => {
                    try {
                        const response = await apiClient.post('/lab-orders/add', {
                            patientId: newLabOrder.patientId,
                            testCategory: newLabOrder.testCategory,
                            testsOrdered: newLabOrder.testsOrdered,
                            priority: newLabOrder.priority,
                            expectedDate: newLabOrder.expectedDate,
                            clinicalIndication: newLabOrder.clinicalIndication,
                            provisionalDiagnosis: newLabOrder.provisionalDiagnosis,
                            specialInstructions: newLabOrder.specialInstructions
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showLabOrderForm.value = false;
                            Object.keys(newLabOrder).forEach(key => newLabOrder[key] = '');
                            newLabOrder.priority = 'Routine';
                        } else {
                            alert('Failed to submit lab order.');
                        }
                    } catch (error) {
                        console.error('Lab order error:', error);
                        alert('Failed to submit lab order.');
                    }
                };


                // Drug Order Functions
                const searchPatientsForDrugOrder = () => {
                    const query = newDrugOrder.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        drugOrderPatientSearchResults.value = [];
                        return;
                    }
                    drugOrderPatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForDrugOrder = (patient) => {
                    newDrugOrder.patientName = `${patient.name} ${patient.surname}`;
                    newDrugOrder.patientId = patient.id;
                    newDrugOrder.patientSearch = `${patient.name} ${patient.surname}`;
                    drugOrderPatientSearchResults.value = [];
                };

                const saveDrugOrder = async () => {
                    try {
                        const response = await apiClient.post('/drug-orders/add', {
                            patientId: newDrugOrder.patientId,
                            drugName: newDrugOrder.drugName,
                            strength: newDrugOrder.strength,
                            form: newDrugOrder.form,
                            route: newDrugOrder.route,
                            frequency: newDrugOrder.frequency,
                            duration: newDrugOrder.duration,
                            quantity: newDrugOrder.quantity,
                            instructions: newDrugOrder.instructions,
                            indication: newDrugOrder.indication,
                            refillable: newDrugOrder.refillable,
                            refills: newDrugOrder.refills,
                            precautions: newDrugOrder.precautions
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showDrugOrderForm.value = false;
                            Object.keys(newDrugOrder).forEach(key => newDrugOrder[key] = '');
                        } else {
                            alert('Failed to issue prescription.');
                        }
                    } catch (error) {
                        console.error('Drug order error:', error);
                        alert('Failed to issue prescription.');
                    }
                };


                // Admission Functions
                const searchPatientsForAdmission = () => {
                    const query = newAdmission.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        admissionPatientSearchResults.value = [];
                        return;
                    }
                    admissionPatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForAdmission = (patient) => {
                    newAdmission.patientName = `${patient.name} ${patient.surname}`;
                    newAdmission.patientId = patient.id;
                    newAdmission.patientSearch = `${patient.name} ${patient.surname}`;
                    admissionPatientSearchResults.value = [];
                };

                const saveAdmission = async () => {
                    try {
                        const response = await apiClient.post('/admissions/add', {
                            patientId: newAdmission.patientId,
                            admissionDateTime: newAdmission.admissionDateTime,
                            admissionType: newAdmission.admissionType,
                            ward: newAdmission.ward,
                            bedNumber: newAdmission.bedNumber,
                            reasonForAdmission: newAdmission.reasonForAdmission,
                            admittingDiagnosis: newAdmission.admittingDiagnosis,
                            attendingPhysician: newAdmission.attendingPhysician,
                            expectedDuration: newAdmission.expectedDuration,
                            severity: newAdmission.severity,
                            treatmentPlan: newAdmission.treatmentPlan,
                            specialInstructions: newAdmission.specialInstructions
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showAdmissionForm.value = false;
                            Object.keys(newAdmission).forEach(key => newAdmission[key] = '');
                        } else {
                            alert('Failed to admit patient.');
                        }
                    } catch (error) {
                        console.error('Admission error:', error);
                        alert('Failed to admit patient.');
                    }
                };

                const initiateDischarge = async (admissionId) => {
                    try {
                        const response = await apiClient.put(`/admissions/${admissionId}/discharge`);
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to initiate discharge.');
                        }
                    } catch (error) {
                        console.error('Discharge error:', error);
                        alert('Failed to initiate discharge.');
                    }
                };


                // ===== PHARMACIST METHODS =====

                const isExpiringSoon = (dateStr) => {
                    if (!dateStr) return false;
                    const cutoff = new Date();
                    cutoff.setDate(cutoff.getDate() + 60);
                    return new Date(dateStr) <= cutoff;
                };

                const openInventoryForm = (item) => {
                    if (item) {
                        inventoryEditingItem.value = item;
                        Object.keys(newInventoryItem).forEach(key => {
                            newInventoryItem[key] = item[key] !== undefined ? item[key] : '';
                        });
                    } else {
                        inventoryEditingItem.value = null;
                        Object.keys(newInventoryItem).forEach(key => {
                            newInventoryItem[key] = key === 'controlledSubstance' ? false : '';
                        });
                    }
                    showInventoryForm.value = true;
                };

                const cancelInventoryForm = () => {
                    showInventoryForm.value = false;
                    inventoryEditingItem.value = null;
                };

                const saveInventoryItem = async () => {
                    try {
                        const payload = {
                            drugName: newInventoryItem.name,
                            genericName: newInventoryItem.genericName,
                            strength: newInventoryItem.strength,
                            form: newInventoryItem.form,
                            category: newInventoryItem.category,
                            manufacturer: newInventoryItem.manufacturer,
                            quantity: Number(newInventoryItem.stockQuantity),
                            reorderLevel: Number(newInventoryItem.reorderLevel),
                            unitOfMeasure: newInventoryItem.unit,
                            batchNumber: newInventoryItem.batchNumber,
                            expiryDate: newInventoryItem.expiryDate,
                            location: newInventoryItem.shelfLocation,
                            unitPrice: Number(newInventoryItem.unitCost),
                            sellingPrice: Number(newInventoryItem.sellingPrice),
                            supplier: newInventoryItem.supplier,
                            supplierContact: '',
                            prescriptionRequired: newInventoryItem.controlledSubstance,
                            storageConditions: newInventoryItem.storageCondition,
                            notes: newInventoryItem.notes
                        };

                        let response;
                        if (inventoryEditingItem.value && inventoryEditingItem.value.id) {
                            response = await apiClient.put(`/inventory/${inventoryEditingItem.value.id}`, payload);
                        } else {
                            response = await apiClient.post('/inventory/add', payload);
                        }

                        if (response.data.status) {
                            await loadAllData();
                            cancelInventoryForm();
                        } else {
                            alert('Failed to save inventory item.');
                        }
                    } catch (error) {
                        console.error('Inventory save error:', error);
                        alert('Failed to save inventory item.');
                    }
                };


                // Dispense Methods
                const searchPatientsForDispense = () => {
                    const q = newDispensation.patientSearch.toLowerCase();
                    if (q.length < 2) { dispensePatientSearchResults.value = []; return; }
                    dispensePatientSearchResults.value = patients.value.filter(p =>
                        p.name.toLowerCase().includes(q) ||
                        p.surname.toLowerCase().includes(q) ||
                        p.nationalId.toLowerCase().includes(q) ||
                        p.phoneNumber.includes(q)
                    );
                };

                const selectPatientForDispense = (patient) => {
                    newDispensation.patientName = `${patient.name} ${patient.surname}`;
                    newDispensation.patientId = patient.id;
                    newDispensation.patientSearch = `${patient.name} ${patient.surname}`;
                    dispensePatientSearchResults.value = [];
                };

                const onDispenseItemSelect = () => {
                    const found = inventoryItems.value.find(i => i.itemCode === dispenseCartItem.medicationId);
                    if (found) {
                        dispenseCartItem.medicationName = found.name;
                        dispenseCartItem.genericName = found.genericName;
                        dispenseCartItem.strength = found.strength;
                        dispenseCartItem.form = found.form;
                        dispenseCartItem.unit = found.unit;
                        dispenseCartItem.batchNumber = found.batchNumber;
                        dispenseCartItem.sellingPrice = found.sellingPrice;
                    }
                };

                const addToDispenseCart = () => {
                    if (!dispenseCartItem.medicationId || !dispenseCartItem.quantity || dispenseCartItem.quantity < 1) return;
                    const inv = inventoryItems.value.find(i => i.itemCode === dispenseCartItem.medicationId);
                    if (!inv) return;
                    // Check stock
                    const alreadyInCart = dispenseCart.value.filter(c => c.medicationId === dispenseCartItem.medicationId).reduce((s, c) => s + Number(c.quantity), 0);
                    if (alreadyInCart + Number(dispenseCartItem.quantity) > inv.stockQuantity) {
                        alert(`Insufficient stock. Only ${inv.stockQuantity} ${inv.unit} available.`); return;
                    }
                    dispenseCart.value.push({
                        medicationId: dispenseCartItem.medicationId,
                        medicationName: dispenseCartItem.medicationName,
                        genericName: dispenseCartItem.genericName,
                        strength: dispenseCartItem.strength,
                        form: dispenseCartItem.form,
                        unit: dispenseCartItem.unit,
                        batchNumber: dispenseCartItem.batchNumber,
                        sellingPrice: dispenseCartItem.sellingPrice,
                        quantity: Number(dispenseCartItem.quantity),
                        instructions: dispenseCartItem.instructions
                    });
                    // Reset cart item
                    dispenseCartItem.medicationId = '';
                    dispenseCartItem.medicationName = '';
                    dispenseCartItem.strength = '';
                    dispenseCartItem.form = '';
                    dispenseCartItem.unit = '';
                    dispenseCartItem.batchNumber = '';
                    dispenseCartItem.sellingPrice = 0;
                    dispenseCartItem.quantity = 1;
                    dispenseCartItem.instructions = '';
                };

                const removeFromDispenseCart = (index) => {
                    dispenseCart.value.splice(index, 1);
                };

                const saveDispensation = async () => {
                    if (dispenseCart.value.length === 0) return;

                    try {
                        const response = await apiClient.post('/dispensing/add', {
                            type: (newDispensation.type || 'OTC').toLowerCase(),
                            patientId: newDispensation.patientId || null,
                            patientName: newDispensation.patientName,
                            paymentMethod: newDispensation.paymentMethod,
                            instructions: newDispensation.instructions,
                            items: dispenseCart.value.map(item => ({
                                itemId: item.medicationId,
                                quantity: item.quantity,
                                unitPrice: item.sellingPrice
                            }))
                        });

                        if (response.data.status) {
                            await loadAllData();
                            dispenseCart.value = [];
                            showDispenseForm.value = false;
                            Object.keys(newDispensation).forEach(key => {
                                if (key === 'type') newDispensation[key] = 'OTC';
                                else if (key === 'counsellingProvided') newDispensation[key] = 'yes';
                                else newDispensation[key] = '';
                            });
                        } else {
                            alert('Failed to save dispensing record.');
                        }
                    } catch (error) {
                        console.error('Dispensing error:', error);
                        alert('Failed to save dispensing record.');
                    }
                };


                // Prescriptions Methods
                const rxByStatus = (status) => drugOrders.value.filter(rx => rx.rxStatus === status);

                const findStockForRx = (rx) => {
                    if (!rx) return null;
                    return inventoryItems.value.find(i =>
                        i.genericName.toLowerCase().includes(rx.drugName.toLowerCase()) ||
                        i.name.toLowerCase().includes(rx.drugName.toLowerCase())
                    ) || null;
                };

                const openPrescriptionDetail = (rx) => {
                    selectedPrescription.value = rx;
                    rxReviewNote.value = rx.rxNote || '';
                    // scroll to top of detail panel
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };

                const updateRxStatus = (id, newStatus) => {
                    const rx = drugOrders.value.find(r => r.id === id);
                    if (!rx) return;
                    rx.rxStatus = newStatus;
                    if (rxReviewNote.value.trim()) {
                        rx.rxNote = rxReviewNote.value.trim();
                    }
                    if (selectedPrescription.value && selectedPrescription.value.id === id) {
                        selectedPrescription.value = { ...rx };
                    }
                    rxReviewNote.value = '';
                };

                const fulfillPrescription = async (rx) => {
                    try {
                        const response = await apiClient.put(`/drug-orders/${rx.id}/mark-dispensed`);
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to mark prescription as dispensed.');
                        }
                    } catch (error) {
                        console.error('Prescription update error:', error);
                        alert('Failed to mark prescription as dispensed.');
                    }
                };

                // Queue Management Methods
                const searchPatientsForQueue = () => {
                    const query = queueForm.patientSearch.toLowerCase();
                    if (query.length < 2) {
                        queuePatientSearchResults.value = [];
                        return;
                    }
                    queuePatientSearchResults.value = patients.value.filter(p => 
                        p.name.toLowerCase().includes(query) ||
                        p.surname.toLowerCase().includes(query) ||
                        p.nationalId.toLowerCase().includes(query) ||
                        p.phoneNumber.includes(query)
                    );
                };

                const selectPatientForQueue = (patient) => {
                    queueForm.patientName = `${patient.name} ${patient.surname}`;
                    queueForm.patientId = patient.id;
                    queueForm.patientSearch = `${patient.name} ${patient.surname}`;
                    queuePatientSearchResults.value = [];
                };

                const addPatientToQueue = async () => {
                    try {
                        const response = await apiClient.post('/queue/add', {
                            patientId: queueForm.patientId,
                            department: queueForm.department,
                            reason: queueForm.reason,
                            priority: queueForm.priority
                        });

                        if (response.data.status) {
                            await loadAllData();
                            showAddToQueueForm.value = false;
                            Object.keys(queueForm).forEach(key => {
                                if (key === 'priority') queueForm[key] = 'Normal';
                                else queueForm[key] = '';
                            });
                        } else {
                            alert('Failed to add patient to queue.');
                        }
                    } catch (error) {
                        console.error('Queue add error:', error);
                        alert('Failed to add patient to queue.');
                    }
                };


                const updateQueueStatus = async (id, newStatus) => {
                    try {
                        const response = await apiClient.put(`/queue/${id}/status`, { status: newStatus });
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to update queue status.');
                        }
                    } catch (error) {
                        console.error('Queue status error:', error);
                        alert('Failed to update queue status.');
                    }
                };

                const callNextPatient = async (id) => {
                    await updateQueueStatus(id, 'called');
                };

                const removeFromQueue = async (id) => {
                    try {
                        const response = await apiClient.delete(`/queue/${id}`);
                        if (response.data.status) {
                            await loadAllData();
                        } else {
                            alert('Failed to remove queue item.');
                        }
                    } catch (error) {
                        console.error('Queue remove error:', error);
                        alert('Failed to remove queue item.');
                    }
                };

                const updateWaitTimes = () => {
                    queueItems.value.forEach(item => {
                        if (item.status !== 'completed') {
                            const checkIn = new Date(item.checkInTime);
                            const now = new Date();
                            item.waitTime = Math.floor((now - checkIn) / 60000);
                        }
                    });
                };

                // Update wait times every minute
                setInterval(updateWaitTimes, 60000);

                const loadAllData = async () => {
                    try {
                        const endpoints = {
                            patients: '/patients',
                            appointments: '/appointments',
                            payments: '/payments',
                            triage: '/triage',
                            beds: '/beds',
                            ward: '/ward',
                            consultations: '/consultations',
                            diagnoses: '/diagnoses',
                            labOrders: '/lab-orders',
                            drugOrders: '/drug-orders',
                            admissions: '/admissions',
                            inventory: '/inventory',
                            dispensing: '/dispensing',
                            queue: '/queue'
                        };

                        const results = await Promise.allSettled(
                            Object.entries(endpoints).map(([key, url]) =>
                                apiClient.get(url).then((response) => ({ key, response }))
                            )
                        );

                        const patientsResult = results.find(r => r.status === 'fulfilled' && r.value.key === 'patients');
                        if (patientsResult) {
                            const data = patientsResult.value.response.data || {};
                            patients.value = (data.patients || []).map(p => ({
                                id: p.id,
                                name: p.name,
                                surname: p.surname,
                                dob: p.dob,
                                nationalId: p.national_id,
                                phoneNumber: p.phone_number,
                                address: p.address,
                                district: p.district,
                                province: p.province,
                                skinColor: p.skin_color,
                                disability: p.disability_status,
                                bloodGroup: p.blood_group,
                                nextOfKin: p.next_of_kin,
                                nextOfKinPhone: p.next_of_kin_phone,
                                nextOfKinAddress: p.next_of_kin_address,
                                category: 'General',
                                waitTime: 0
                            }));
                        }

                        const findPatientName = (patientId) => {
                            const patient = patients.value.find(p => p.id === patientId);
                            return patient ? `${patient.name} ${patient.surname}` : '';
                        };

                        results.forEach((result) => {
                            if (result.status !== 'fulfilled') return;
                            const { key, response } = result.value;
                            const data = response.data || {};

                            switch (key) {
                                case 'patients':
                                    patients.value = (data.patients || []).map(p => ({
                                        id: p.id,
                                        name: p.name,
                                        surname: p.surname,
                                        dob: p.dob,
                                        nationalId: p.national_id,
                                        phoneNumber: p.phone_number,
                                        address: p.address,
                                        district: p.district,
                                        province: p.province,
                                        skinColor: p.skin_color,
                                        disability: p.disability_status,
                                        bloodGroup: p.blood_group,
                                        nextOfKin: p.next_of_kin,
                                        nextOfKinPhone: p.next_of_kin_phone,
                                        nextOfKinAddress: p.next_of_kin_address,
                                        category: 'General',
                                        waitTime: 0
                                    }));
                                    break;
                                case 'appointments':
                                    appointments.value = (data.appointments || []).map(a => {
                                        const dt = a.date_time ? new Date(a.date_time) : null;
                                        return {
                                            id: a.id,
                                            patientId: a.patient_id,
                                            patientName: findPatientName(a.patient_id),
                                            doctor: a.doctor_id,
                                            department: a.department,
                                            date: dt ? dt.toISOString().slice(0, 10) : '',
                                            time: dt ? dt.toTimeString().slice(0, 5) : '',
                                            reason: a.reason,
                                            priority: a.priority,
                                            type: a.appointment_type,
                                            status: a.status,
                                            paymentType: a.payment_type,
                                            payed: a.payed,
                                            total: a.total
                                        };
                                    });
                                    break;
                                case 'payments':
                                    payments.value = (data.payments || []).map(p => ({
                                        id: p.id,
                                        patientId: p.patient_id,
                                        appointmentId: p.appointment_id,
                                        service: p.service,
                                        amount: p.amount,
                                        paymentMethod: p.payment_method,
                                        status: p.status
                                    }));
                                    break;
                                case 'triage':
                                    triageRecords.value = (data.triage_records || []).map(t => ({
                                        id: t.id,
                                        patientId: t.patient_id,
                                        patientName: findPatientName(t.patient_id),
                                        bpSystolic: t.bp_systolic,
                                        bpDiastolic: t.bp_diastolic,
                                        temperature: t.temperature,
                                        pulse: t.pulse,
                                        respiratoryRate: t.respiratory_rate,
                                        weight: t.weight,
                                        height: t.height,
                                        oxygenSaturation: t.oxygen_saturation,
                                        bloodSugar: t.blood_sugar,
                                        priority: t.priority,
                                        chiefComplaint: t.chief_complaint,
                                        symptoms: t.symptoms,
                                        notes: t.notes,
                                        recordedAt: t.recorded_at
                                    }));
                                    break;
                                case 'beds':
                                    beds.value = (data.beds || []).map(b => ({
                                        id: b.id,
                                        number: b.number,
                                        ward: b.ward,
                                        status: b.status,
                                        patientId: b.patient_id,
                                        patientName: findPatientName(b.patient_id)
                                    }));
                                    break;
                                case 'ward':
                                    wardAdmissions.value = (data.ward_admissions || []).map(w => ({
                                        id: w.id,
                                        patientId: w.patient_id,
                                        patientName: findPatientName(w.patient_id),
                                        ward: w.ward,
                                        bedNumber: w.bed_number,
                                        admissionDate: w.admission_date,
                                        diagnosis: w.diagnosis,
                                        status: w.status,
                                        notes: w.notes
                                    }));
                                    break;
                                case 'consultations':
                                    consultations.value = (data.consultations || []).map(c => ({
                                        id: c.id,
                                        patientId: c.patient_id,
                                        patientName: findPatientName(c.patient_id),
                                        chiefComplaint: c.chief_complaint,
                                        symptomDuration: c.symptom_duration,
                                        severity: c.severity,
                                        status: c.status,
                                        createdAt: c.created_at
                                    }));
                                    break;
                                case 'diagnoses':
                                    diagnosisRecords.value = (data.diagnoses || []).map(d => ({
                                        id: d.id,
                                        patientId: d.patient_id,
                                        patientName: findPatientName(d.patient_id),
                                        primaryDiagnosis: d.primary_diagnosis,
                                        diagnosisType: d.diagnosis_type,
                                        severity: d.severity,
                                        createdAt: d.created_at
                                    }));
                                    break;
                                case 'labOrders':
                                    labOrders.value = (data.lab_orders || []).map(o => ({
                                        id: o.id,
                                        patientId: o.patient_id,
                                        patientName: findPatientName(o.patient_id),
                                        testCategory: o.test_category,
                                        testsOrdered: o.tests_ordered,
                                        priority: o.priority,
                                        expectedDate: o.expected_date,
                                        clinicalIndication: o.clinical_indication,
                                        provisionalDiagnosis: o.provisional_diagnosis,
                                        status: o.status,
                                        createdAt: o.created_at
                                    }));
                                    break;
                                case 'drugOrders':
                                    drugOrders.value = (data.drug_orders || []).map(o => ({
                                        id: o.id,
                                        patientId: o.patient_id,
                                        patientName: findPatientName(o.patient_id),
                                        drugName: o.drug_name,
                                        strength: o.strength,
                                        form: o.form,
                                        route: o.route,
                                        frequency: o.frequency,
                                        duration: o.duration,
                                        quantity: o.quantity,
                                        instructions: o.instructions,
                                        indication: o.indication,
                                        refillable: o.refillable,
                                        refills: o.refills,
                                        rxStatus: o.status,
                                        status: o.status,
                                        createdAt: o.created_at
                                    }));
                                    break;
                                case 'admissions':
                                    admissionRecords.value = (data.admissions || []).map(a => ({
                                        id: a.id,
                                        patientId: a.patient_id,
                                        patientName: findPatientName(a.patient_id),
                                        admissionDate: a.admission_date_time,
                                        admissionType: a.admission_type,
                                        ward: a.ward,
                                        bedNumber: a.bed_number,
                                        admittingDiagnosis: a.admitting_diagnosis,
                                        attendingPhysician: a.attending_physician,
                                        severity: a.severity,
                                        status: a.status
                                    }));
                                    break;
                                case 'inventory':
                                    inventoryItems.value = (data.inventory || []).map(i => ({
                                        id: i.id,
                                        itemCode: i.id,
                                        name: i.drug_name,
                                        genericName: i.generic_name,
                                        strength: i.strength,
                                        form: i.form,
                                        category: i.category,
                                        manufacturer: i.manufacturer,
                                        stockQuantity: i.quantity,
                                        reorderLevel: i.reorder_level,
                                        unit: i.unit_of_measure,
                                        batchNumber: i.batch_number,
                                        expiryDate: i.expiry_date,
                                        location: i.location,
                                        unitPrice: i.unit_price,
                                        sellingPrice: i.selling_price,
                                        supplier: i.supplier,
                                        prescriptionRequired: i.prescription_required
                                    }));
                                    break;
                                case 'dispensing':
                                    dispensationRecords.value = (data.dispensing_records || []).map(d => ({
                                        id: d.id,
                                        date: d.dispensed_at,
                                        time: d.dispensed_at,
                                        patientName: d.patient_name,
                                        patientId: d.patient_id,
                                        type: d.type,
                                        itemsSummary: (d.items || []).map(item => `${item.inventory_id} x${item.quantity}`).join(', '),
                                        paymentMethod: d.payment_method,
                                        totalAmount: d.total_amount,
                                        dispensedBy: d.dispensed_by_id
                                    }));
                                    break;
                                default:
                                    break;
                            }
                        });
                    } catch (error) {
                        console.error('Failed to load data:', error);
                    }
                };

                const signup = async () => {
                    if (!signupForm.email || !signupForm.password || !signupForm.role) {
                        alert('Please complete the signup form.');
                        return;
                    }

                    try {
                        const usernameBase = signupForm.email.split('@')[0] || signupForm.firstName || 'staff';
                        const response = await apiClient.post('/add/user', {
                            firstname: signupForm.firstName,
                            lastname: signupForm.lastName,
                            username: usernameBase,
                            email: signupForm.email,
                            role: signupForm.role.toLowerCase(),
                            password: signupForm.password
                        });

                        if (response.data.status) {
                            authView.value = 'login';
                            Object.keys(signupForm).forEach(key => signupForm[key] = '');
                            alert('Account created. Please log in.');
                        } else {
                            alert('Signup failed. Please try again.');
                        }
                    } catch (error) {
                        console.error('Signup error:', error);
                        alert('Signup failed. Please try again.');
                    }
                };

                const login = async () => {
                    if (!loginForm.email || !loginForm.password) {
                        alert('Please enter your email and password.');
                        return;
                    }

                    try {
                        const response = await apiClient.post('/login', {
                            email: loginForm.email,
                            password: loginForm.password
                        });

                        if (response.data.status) {
                            const token = response.data.token;
                            const normalizedRole = response.data.role ? response.data.role.charAt(0).toUpperCase() + response.data.role.slice(1) : 'Receptionist';
                            const tokenPayload = parseJwtPayload(token);
                            const userId = tokenPayload ? String(tokenPayload.user_id) : '';

                            localStorage.setItem('auth_token', token);
                            localStorage.setItem('user_data', JSON.stringify({
                                role: normalizedRole,
                                email: response.data.email,
                                name: response.data.name,
                                id: userId
                            }));

                            user.value = {
                                role: normalizedRole,
                                email: response.data.email,
                                name: response.data.name,
                                id: userId
                            };

                            await loadAllData();
                        } else {
                            alert('Login failed. Please check your credentials.');
                        }
                    } catch (error) {
                        console.error('Login error:', error);
                        alert('Login failed. Please check your credentials.');
                    }
                };

                const logout = () => {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                    user.value = null;
                    currentPage.value = 'overview';
                    authView.value = 'login';
                };

                const loadUserFromStorage = () => {
                    const token = localStorage.getItem('auth_token');
                    const userData = localStorage.getItem('user_data');
                    if (token && userData) {
                        const storedUser = JSON.parse(userData);
                        user.value = storedUser;
                        loadAllData();
                    }
                };

                loadUserFromStorage();

                return {
                    user, currentPage, authView, loginForm, signupForm, menuItems, roleActions, stats,
                    patients, appointments, payments, newPatient, newAppointment, searchQuery,
                    showAppointmentForm, appointmentFilter, paymentFilter, patientSearchResults,
                    filteredAppointments, filteredPayments, paymentStats, Icons,
                    login, signup, logout, savePatient, handleAction, searchPatients,
                    selectPatientForAppointment, saveAppointment, updateAppointmentStatus,
                    updatePaymentStatus, updatePayment,
                    // Queue Management
                    showAddToQueueForm, queuePatientSearchResults, queueDepartmentFilter, queueStatusFilter, queuePriorityFilter,
                    queueForm, queueItems, filteredQueueItems, averageWaitTime, longestWait, nextInQueue,
                    searchPatientsForQueue, selectPatientForQueue, addPatientToQueue, updateQueueStatus,
                    callNextPatient, removeFromQueue, updateWaitTimes,
                    showTriageForm, showWardForm, triagePatientSearchResults, wardPatientSearchResults,
                    selectedWardFilter, profileSearch, profileSearchResults, selectedProfile, editingProfile,
                    newTriage, triageRecords, newWardAdmission, wardAdmissions, beds,
                    searchPatientsForTriage, selectPatientForTriage, saveTriageRecord,
                    searchPatientsForWard, selectPatientForWard, saveWardAdmission, dischargePatient,
                    updateBedStatus, searchPatientProfile, selectPatientProfile, saveProfileUpdate,
                    availableBeds, filteredBeds, bedStats,
                    showConsultationForm, showDiagnosisForm, showLabOrderForm, showDrugOrderForm, showAdmissionForm,
                    consultationPatientSearchResults, diagnosisPatientSearchResults, labOrderPatientSearchResults,
                    drugOrderPatientSearchResults, admissionPatientSearchResults,
                    newConsultation, consultations, newDiagnosis, diagnosisRecords,
                    newLabOrder, labOrders, newDrugOrder, drugOrders, newAdmission, admissionRecords,
                    searchPatientsForConsultation, selectPatientForConsultation, saveConsultation,
                    searchPatientsForDiagnosis, selectPatientForDiagnosis, saveDiagnosis,
                    searchPatientsForLabOrder, selectPatientForLabOrder, saveLabOrder,
                    searchPatientsForDrugOrder, selectPatientForDrugOrder, saveDrugOrder,
                    searchPatientsForAdmission, selectPatientForAdmission, saveAdmission, initiateDischarge,
                    // Pharmacist – Inventory
                    showInventoryForm, inventoryEditingItem, inventorySearchQuery, inventoryCategoryFilter,
                    newInventoryItem, inventoryItems, lowStockItems, expiringSoonItems, filteredInventory,
                    openInventoryForm, cancelInventoryForm, saveInventoryItem, isExpiringSoon,
                    // Pharmacist – Dispensing
                    showDispenseForm, dispensePatientSearchResults, dispenseTypeFilter,
                    newDispensation, dispenseCartItem, dispenseCart, dispensationRecords,
                    dispenseCartTotal, filteredDispensationRecords, todayDate,
                    searchPatientsForDispense, selectPatientForDispense, onDispenseItemSelect,
                    addToDispenseCart, removeFromDispenseCart, saveDispensation,
                    // Pharmacist – Prescriptions
                    selectedPrescription, rxReviewNote, rxStatusFilter, rxSearchQuery,
                    pendingPrescriptions, filteredPrescriptions, rxByStatus,
                    findStockForRx, openPrescriptionDetail, updateRxStatus, fulfillPrescription
                };
            }
        }).mount('#app');
    
