from medcore import db
from datetime import datetime
# import pytz

time_zone = "Africa/Harare"

class Users(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, index=True)
    firstname = db.Column(db.String(100), nullable=False, index=True)
    lastname = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), nullable=False, unique=True, index=True)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    role = db.Column(db.String(255), nullable=False, unique=False, default='user', index=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True))
    appointment = db.relationship("Appointments", backref="users")


class Patients(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.Integer, primary_key=True, index=True)
    name = db.Column(db.String(255), nullable=False, unique=False, index=True)
    surname = db.Column(db.String(255), nullable=False, unique=False, index=True)
    dob = db.Column(db.String(255), nullable=False, unique=False)
    national_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    phone_number = db.Column(db.String(255), nullable=False, unique=True, index=True)
    address = db.Column(db.String(255), nullable=False, unique=False)
    district = db.Column(db.String(255), nullable=False, unique=False)
    province = db.Column(db.String(255), nullable=False, unique=False)
    skin_color = db.Column(db.String(255), nullable=False, unique=False)
    disability_status = db.Column(db.String(255), nullable=False, unique=False, default='able')
    next_of_kin = db.Column(db.String(255), nullable=False, unique=False)
    next_of_kin_address = db.Column(db.String(255), nullable=False, unique=False)
    blood_group = db.Column(db.String(255), nullable=False, unique=False)
    dna_scan_id = db.Column(db.String(255), nullable=False, unique=False)
    appointments = db.relationship("Appointments", backref="patient")
    # Added to align with frontend registration and profile forms
    next_of_kin_phone = db.Column(db.String(255), nullable=True, unique=False)
    allergies = db.Column(db.Text, nullable=True, unique=False)
    chronic_conditions = db.Column(db.Text, nullable=True, unique=False)
    current_medications = db.Column(db.Text, nullable=True, unique=False)
    immunizations = db.Column(db.Text, nullable=True, unique=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True))


class Appointments(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True, index=True)
    note = db.Column(db.String(255), nullable=False, unique=False)
    payed = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    total = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    payment_type = db.Column(db.String(255), nullable=False, unique=False, default="cash")
    date_time = db.Column(db.DateTime, nullable=False, unique=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"))
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    # Added to align with the frontend appointment booking form
    department = db.Column(db.String(255), nullable=True, unique=False)
    reason = db.Column(db.Text, nullable=True, unique=False)
    priority = db.Column(db.String(100), nullable=False, unique=False, default='Normal')
    appointment_type = db.Column(db.String(100), nullable=False, unique=False, default='First Visit')
    status = db.Column(db.String(100), nullable=False, unique=False, default='scheduled', index=True)


class Inventory(db.Model):
    __tablename__ = "inventory"

    id = db.Column(db.Integer, primary_key=True, index=True)
    drug_name = db.Column(db.String(255), nullable=False, unique=False, index=True)
    generic_name = db.Column(db.String(255), nullable=True, unique=False)
    strength = db.Column(db.String(255), nullable=False, unique=False)
    form = db.Column(db.String(100), nullable=False, unique=False)
    category = db.Column(db.String(100), nullable=True, unique=False, index=True)
    manufacturer = db.Column(db.String(255), nullable=True, unique=False)
    quantity = db.Column(db.Integer, nullable=False, unique=False, default=0)
    reorder_level = db.Column(db.Integer, nullable=False, unique=False, default=0)
    unit_of_measure = db.Column(db.String(100), nullable=False, unique=False, default='Pieces')
    batch_number = db.Column(db.String(255), nullable=False, unique=False)
    expiry_date = db.Column(db.Date, nullable=False, unique=False)
    location = db.Column(db.String(255), nullable=True, unique=False)
    unit_price = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    selling_price = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    supplier = db.Column(db.String(255), nullable=True, unique=False)
    supplier_contact = db.Column(db.String(255), nullable=True, unique=False)
    prescription_required = db.Column(db.Boolean, nullable=False, unique=False, default=False)
    storage_conditions = db.Column(db.Text, nullable=True, unique=False)
    notes = db.Column(db.Text, nullable=True, unique=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True))
    dispensing_items = db.relationship("DispensingItem", backref="inventory")


class Triage(db.Model):
    __tablename__ = "triage"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    nurse_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    bp_systolic = db.Column(db.Integer, nullable=False, unique=False)
    bp_diastolic = db.Column(db.Integer, nullable=False, unique=False)
    temperature = db.Column(db.Numeric(precision=5, scale=2), nullable=False, unique=False)
    pulse = db.Column(db.Integer, nullable=False, unique=False)
    respiratory_rate = db.Column(db.Integer, nullable=False, unique=False)
    weight = db.Column(db.Numeric(precision=6, scale=2), nullable=True, unique=False)
    height = db.Column(db.Numeric(precision=6, scale=2), nullable=True, unique=False)
    oxygen_saturation = db.Column(db.Numeric(precision=5, scale=2), nullable=True, unique=False)
    blood_sugar = db.Column(db.Numeric(precision=6, scale=2), nullable=True, unique=False)
    priority = db.Column(db.String(100), nullable=False, unique=False, index=True)
    chief_complaint = db.Column(db.String(255), nullable=False, unique=False)
    symptoms = db.Column(db.Text, nullable=True, unique=False)
    notes = db.Column(db.Text, nullable=True, unique=False)
    recorded_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="triage_records")
    nurse = db.relationship("Users", backref="triage_records")


class Beds(db.Model):
    __tablename__ = "beds"

    id = db.Column(db.Integer, primary_key=True, index=True)
    number = db.Column(db.String(100), nullable=False, unique=True, index=True)
    ward = db.Column(db.String(255), nullable=False, unique=False, index=True)
    status = db.Column(db.String(100), nullable=False, unique=False, default='vacant', index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=True)
    patient = db.relationship("Patients", backref="bed")


class WardAdmission(db.Model):
    __tablename__ = "ward_admissions"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    bed_id = db.Column(db.Integer, db.ForeignKey("beds.id"), nullable=True)
    ward = db.Column(db.String(255), nullable=False, unique=False)
    bed_number = db.Column(db.String(100), nullable=False, unique=False)
    admission_date = db.Column(db.DateTime, nullable=False, unique=False)
    diagnosis = db.Column(db.String(255), nullable=False, unique=False)
    notes = db.Column(db.Text, nullable=True, unique=False)
    status = db.Column(db.String(100), nullable=False, unique=False, default='admitted', index=True)
    discharged_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="ward_admissions")
    doctor = db.relationship("Users", backref="ward_admissions")
    bed = db.relationship("Beds", backref="ward_admissions")


class QueueItem(db.Model):
    __tablename__ = "queue_items"

    id = db.Column(db.Integer, primary_key=True, index=True)
    queue_number = db.Column(db.Integer, nullable=False, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    department = db.Column(db.String(255), nullable=False, unique=False)
    reason = db.Column(db.Text, nullable=True, unique=False)
    priority = db.Column(db.String(100), nullable=False, unique=False, default='Normal', index=True)
    status = db.Column(db.String(100), nullable=False, unique=False, default='waiting', index=True)
    check_in_time = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    patient = db.relationship("Patients", backref="queue_items")


class Consultation(db.Model):
    __tablename__ = "consultations"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    chief_complaint = db.Column(db.Text, nullable=False, unique=False)
    symptom_duration = db.Column(db.String(255), nullable=False, unique=False)
    severity = db.Column(db.String(100), nullable=False, unique=False)
    history_present = db.Column(db.Text, nullable=False, unique=False)
    associated_symptoms = db.Column(db.Text, nullable=True, unique=False)
    previous_illnesses = db.Column(db.Text, nullable=True, unique=False)
    surgical_history = db.Column(db.Text, nullable=True, unique=False)
    current_medications = db.Column(db.Text, nullable=True, unique=False)
    allergies = db.Column(db.Text, nullable=True, unique=False)
    exam_bp = db.Column(db.String(100), nullable=True, unique=False)
    exam_heart_rate = db.Column(db.String(100), nullable=True, unique=False)
    exam_temperature = db.Column(db.String(100), nullable=True, unique=False)
    exam_respiratory_rate = db.Column(db.String(100), nullable=True, unique=False)
    exam_spo2 = db.Column(db.String(100), nullable=True, unique=False)
    exam_weight = db.Column(db.String(100), nullable=True, unique=False)
    exam_findings = db.Column(db.Text, nullable=False, unique=False)
    working_diagnosis = db.Column(db.Text, nullable=False, unique=False)
    clinical_notes = db.Column(db.Text, nullable=True, unique=False)
    status = db.Column(db.String(100), nullable=False, unique=False, default='waiting', index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="consultations")
    doctor = db.relationship("Users", backref="consultations")


class Diagnosis(db.Model):
    __tablename__ = "diagnoses"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    primary_diagnosis = db.Column(db.Text, nullable=False, unique=False)
    icd_code = db.Column(db.String(100), nullable=True, unique=False)
    secondary_diagnosis = db.Column(db.Text, nullable=True, unique=False)
    diagnosis_type = db.Column(db.String(100), nullable=False, unique=False)
    severity = db.Column(db.String(100), nullable=True, unique=False)
    clinical_assessment = db.Column(db.Text, nullable=False, unique=False)
    supporting_evidence = db.Column(db.Text, nullable=True, unique=False)
    additional_notes = db.Column(db.Text, nullable=True, unique=False)
    treatment_plan = db.Column(db.Text, nullable=False, unique=False)
    prognosis = db.Column(db.String(100), nullable=True, unique=False)
    follow_up_instructions = db.Column(db.Text, nullable=True, unique=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="diagnoses")
    doctor = db.relationship("Users", backref="diagnoses")


class LabOrder(db.Model):
    __tablename__ = "lab_orders"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    test_category = db.Column(db.String(255), nullable=False, unique=False)
    tests_ordered = db.Column(db.Text, nullable=False, unique=False)
    priority = db.Column(db.String(100), nullable=False, unique=False, default='Routine', index=True)
    expected_date = db.Column(db.Date, nullable=True, unique=False)
    clinical_indication = db.Column(db.Text, nullable=False, unique=False)
    provisional_diagnosis = db.Column(db.String(255), nullable=True, unique=False)
    special_instructions = db.Column(db.Text, nullable=True, unique=False)
    status = db.Column(db.String(100), nullable=False, unique=False, default='pending', index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="lab_orders")
    doctor = db.relationship("Users", backref="lab_orders")


class DrugOrder(db.Model):
    __tablename__ = "drug_orders"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    drug_name = db.Column(db.String(255), nullable=False, unique=False, index=True)
    strength = db.Column(db.String(255), nullable=False, unique=False)
    form = db.Column(db.String(100), nullable=False, unique=False)
    route = db.Column(db.String(100), nullable=False, unique=False)
    frequency = db.Column(db.String(255), nullable=False, unique=False)
    duration = db.Column(db.String(255), nullable=False, unique=False)
    quantity = db.Column(db.Integer, nullable=False, unique=False)
    instructions = db.Column(db.Text, nullable=False, unique=False)
    indication = db.Column(db.String(255), nullable=False, unique=False)
    refillable = db.Column(db.Boolean, nullable=False, unique=False, default=False)
    refills = db.Column(db.Integer, nullable=False, unique=False, default=0)
    precautions = db.Column(db.Text, nullable=True, unique=False)
    status = db.Column(db.String(100), nullable=False, unique=False, default='active', index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="drug_orders")
    doctor = db.relationship("Users", backref="drug_orders")


class Admission(db.Model):
    __tablename__ = "admissions"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    admission_date_time = db.Column(db.DateTime, nullable=False, unique=False)
    admission_type = db.Column(db.String(100), nullable=False, unique=False)
    ward = db.Column(db.String(255), nullable=False, unique=False)
    bed_number = db.Column(db.String(100), nullable=True, unique=False)
    reason_for_admission = db.Column(db.Text, nullable=False, unique=False)
    admitting_diagnosis = db.Column(db.Text, nullable=False, unique=False)
    attending_physician = db.Column(db.String(255), nullable=False, unique=False)
    expected_duration = db.Column(db.String(255), nullable=True, unique=False)
    severity = db.Column(db.String(100), nullable=True, unique=False)
    treatment_plan = db.Column(db.Text, nullable=True, unique=False)
    special_instructions = db.Column(db.Text, nullable=True, unique=False)
    status = db.Column(db.String(100), nullable=False, unique=False, default='admitted', index=True)
    discharge_date = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="admissions")
    doctor = db.relationship("Users", backref="admissions")


class Dispensing(db.Model):
    __tablename__ = "dispensing"

    id = db.Column(db.Integer, primary_key=True, index=True)
    type = db.Column(db.String(100), nullable=False, unique=False, default='otc', index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=True)
    patient_name = db.Column(db.String(255), nullable=True, unique=False)
    drug_order_id = db.Column(db.Integer, db.ForeignKey("drug_orders.id"), nullable=True)
    payment_method = db.Column(db.String(100), nullable=False, unique=False)
    instructions = db.Column(db.Text, nullable=True, unique=False)
    total_amount = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    dispensed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    dispensed_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    patient = db.relationship("Patients", backref="dispensing_records")
    dispensed_by = db.relationship("Users", backref="dispensing_records")
    drug_order = db.relationship("DrugOrder", backref="dispensing_records")
    items = db.relationship("DispensingItem", backref="dispensing")


class DispensingItem(db.Model):
    __tablename__ = "dispensing_items"

    id = db.Column(db.Integer, primary_key=True, index=True)
    dispensing_id = db.Column(db.Integer, db.ForeignKey("dispensing.id"), nullable=False)
    inventory_id = db.Column(db.Integer, db.ForeignKey("inventory.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, unique=False)
    unit_price = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    total = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)


class Payments(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True, index=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patients.id"), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey("appointments.id"), nullable=True)
    service = db.Column(db.String(255), nullable=False, unique=False)
    amount = db.Column(db.Numeric(precision=10, scale=2), nullable=False, unique=False)
    payment_method = db.Column(db.String(100), nullable=False, unique=False, default='Cash')
    status = db.Column(db.String(100), nullable=False, unique=False, default='pending', index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True))
    patient = db.relationship("Patients", backref="payments")
    appointment = db.relationship("Appointments", backref="payments")
