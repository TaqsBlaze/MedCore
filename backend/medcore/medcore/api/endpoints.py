from flask import jsonify, render_template, request
from medcore.auth.token import token_required
from medcore import app, db
import jwt
import os

from medcore.models.models import (
    Patients, Appointments, Payments,
    Triage, Beds, WardAdmission, Users,
    Consultation, Diagnosis, LabOrder, DrugOrder, Admission,
    Inventory, Dispensing, DispensingItem, QueueItem
)
from datetime import datetime


def reception_data_access() -> dict:
    '''## Data Access Controller
    This controller retrieves data for reception role ID 
    '''
    patients = Patients.query.order_by(Patients.created_at.desc()).limit(10).all()
    appointments_today = Appointments.query.filter(
        db.func.date(Appointments.date_time) == datetime.utcnow().date()
    ).all()
    pending_payments = Payments.query.filter_by(status='pending').count()
    complete_payments = Payments.query.filter_by(status='complete').count()

    return {
        'recent_patients': [
            {
                'id': p.id,
                'name': p.name,
                'surname': p.surname,
                'national_id': p.national_id,
                'phone_number': p.phone_number
            } for p in patients
        ],
        'appointments_today': len(appointments_today),
        'scheduled_appointments': sum(1 for a in appointments_today if a.status == 'scheduled'),
        'completed_appointments': sum(1 for a in appointments_today if a.status == 'completed'),
        'pending_payments': pending_payments,
        'complete_payments': complete_payments
    }


def nurse_data_access() -> dict:
    '''## Data Access Controller
    This controller retrieves data for nurse role ID 
    '''
    triage_today = Triage.query.filter(
        db.func.date(Triage.recorded_at) == datetime.utcnow().date()
    ).all()
    ward_admissions = WardAdmission.query.filter_by(status='admitted').count()
    total_beds = Beds.query.count()
    occupied_beds = Beds.query.filter_by(status='occupied').count()
    vacant_beds = Beds.query.filter_by(status='vacant').count()
    cleaning_beds = Beds.query.filter_by(status='cleaning').count()

    return {
        'triage_today': len(triage_today),
        'critical_triage': sum(1 for t in triage_today if t.priority == 'Critical'),
        'current_ward_admissions': ward_admissions,
        'bed_stats': {
            'total': total_beds,
            'occupied': occupied_beds,
            'vacant': vacant_beds,
            'cleaning': cleaning_beds
        }
    }


def doc_data_access() -> dict:
    '''## Data Access Controller
    This controller retrieves data for doctor role ID 
    '''
    consultations_today = Consultation.query.filter(
        db.func.date(Consultation.created_at) == datetime.utcnow().date()
    ).all()
    pending_lab_orders = LabOrder.query.filter_by(status='pending').count()
    active_prescriptions = DrugOrder.query.filter_by(status='active').count()
    current_admissions = Admission.query.filter_by(status='admitted').count()
    pending_diagnoses = Diagnosis.query.order_by(Diagnosis.created_at.desc()).limit(5).all()

    return {
        'consultations_today': len(consultations_today),
        'waiting_consultations': sum(1 for c in consultations_today if c.status == 'waiting'),
        'in_progress_consultations': sum(1 for c in consultations_today if c.status == 'in-progress'),
        'completed_consultations': sum(1 for c in consultations_today if c.status == 'completed'),
        'pending_lab_orders': pending_lab_orders,
        'active_prescriptions': active_prescriptions,
        'current_admissions': current_admissions,
        'recent_diagnoses': [
            {
                'id': d.id,
                'patient_id': d.patient_id,
                'primary_diagnosis': d.primary_diagnosis,
                'diagnosis_type': d.diagnosis_type,
                'severity': d.severity
            } for d in pending_diagnoses
        ]
    }


def pharmacy_data_access() -> dict:
    '''## Data Access Controller
    This controller retrieves data for pharmacy role ID 
    '''
    low_stock = Inventory.query.filter(
        Inventory.quantity <= Inventory.reorder_level
    ).all()
    pending_prescriptions = DrugOrder.query.filter_by(status='active').count()
    dispensed_today = Dispensing.query.filter(
        db.func.date(Dispensing.dispensed_at) == datetime.utcnow().date()
    ).count()
    total_stock_value = db.session.query(
        db.func.sum(Inventory.quantity * Inventory.unit_price)
    ).scalar() or 0

    return {
        'low_stock_count': len(low_stock),
        'low_stock_items': [
            {
                'id': i.id,
                'drug_name': i.drug_name,
                'quantity': i.quantity,
                'reorder_level': i.reorder_level
            } for i in low_stock
        ],
        'pending_prescriptions': pending_prescriptions,
        'dispensed_today': dispensed_today,
        'total_stock_value': float(total_stock_value)
    }


CONTROLLERS = {
    'receptionist': reception_data_access,
    'nurse': nurse_data_access,
    'doctor': doc_data_access,
    'pharmacist': pharmacy_data_access
}


@app.route("/api/add/user", methods=['POST'])
def add_user():

    data = request.get_json()

    new_user = Users(
        firstname = data['firstname'],
        lastname = data['lastname'],
        username = data['username'],
        email = data['email'],
        role = data['role'],
        password = data['password']
    )

    try:

        db.session.add(new_user)
       
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'User registered successfully'
            }
        )
    
    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to register user',
                'reason': f'{error}'
            }
        )
    

@app.route("/api/login", methods=['POST'])
def login():

    data = request.get_json()

    user = Users.query.filter_by(email = data['email']).first()

    if user and user.password == data['password']:

        secret_key = os.getenv('SECRET_KEY') or app.config.get('SECRET_KEY')
        token = jwt.encode(
            {'user_id':user.id,'user_email':user.email,'role':user.role},
            secret_key,
            algorithm="HS256"
        )

        return jsonify(
            {
                'role': user.role,
                'email': user.email,
                'name': user.username,
                'token': token,
                'status': True
            }
        )
    
    else:

        return jsonify(
            {
                'status': False,
                'message': 'Check your email and password',
                'reason': 'Failed to authenticate'
            }
        ), 401


@app.route("/api/dashboard/signup", methods=['POST'])
def dashboard_signup():

    data = request.get_json()

    new_user = Users(
        firstname = data['firstname'],
        lastname = data['lastname'],
        username = data['username'],
        email = data['email'],
        role = data.get('role', 'receptionist'),
        password = data['password']
    )

    try:

        db.session.add(new_user)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'User registered successfully'
            }
        )
    
    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to register user',
                'reason': f'{error}'
            }
        )


@app.route("/api/dashboard/login", methods=['POST'])
def dashboard_login():

    data = request.get_json()

    user = Users.query.filter_by(email = data['email']).first()

    if user and user.password == data['password']:

        secret_key = os.getenv('SECRET_KEY') or app.config.get('SECRET_KEY')
        token = jwt.encode(
            {'user_id':user.id,'user_email':user.email,'role':user.role},
            secret_key,
            algorithm="HS256"
        )

        return jsonify(
            {
                'role': user.role,
                'email': user.email,
                'name': user.username,
                'token': token,
                'status': True
            }
        )
    
    else:

        return jsonify(
            {
                'status': False,
                'message': 'Check your email and password',
                'reason': 'Failed to authenticate'
            }
        ), 401
    

@app.route("/api/dashboard/<roleID>/<userID>", methods=['GET','POST'])
@token_required
def dashboard(current_user, roleID, userID):

    if request.method == "GET":

        user = Users.query.filter_by(id = userID).first()
        if user and user.role == roleID:
            data = CONTROLLERS[f'{roleID}']()

            return jsonify(
                {
                    'data':data,
                    'status': True
                }
            )
        
        else:

            return jsonify(
                {
                    'message':'Failed to get data',
                    'status': False,
                    'reason':'Unauthorized access'
                }
            ), 401


# ============================================================
# PATIENT ENDPOINTS
# Covers: Registration form, Patient Profile Maintenance form,
# and the patient search used across all modules
# ============================================================

@app.route("/api/patients", methods=['GET'])
@token_required
def get_patients(current_user):

    patients = Patients.query.order_by(Patients.created_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'patients': [
                {
                    'id': p.id,
                    'name': p.name,
                    'surname': p.surname,
                    'dob': p.dob,
                    'national_id': p.national_id,
                    'phone_number': p.phone_number,
                    'address': p.address,
                    'district': p.district,
                    'province': p.province,
                    'skin_color': p.skin_color,
                    'disability_status': p.disability_status,
                    'blood_group': p.blood_group,
                    'next_of_kin': p.next_of_kin,
                    'next_of_kin_phone': p.next_of_kin_phone,
                    'next_of_kin_address': p.next_of_kin_address
                } for p in patients
            ]
        }
    )


@app.route("/api/patients/search", methods=['GET'])
@token_required
def search_patients(current_user):

    query = request.args.get('q', '')

    if not query:
        return jsonify({'status': False, 'message': 'Search query is required'}), 400

    results = Patients.query.filter(
        db.or_(
            Patients.name.ilike(f'%{query}%'),
            Patients.surname.ilike(f'%{query}%'),
            Patients.national_id.ilike(f'%{query}%'),
            Patients.phone_number.ilike(f'%{query}%')
        )
    ).limit(10).all()

    return jsonify(
        {
            'status': True,
            'patients': [
                {
                    'id': p.id,
                    'name': p.name,
                    'surname': p.surname,
                    'national_id': p.national_id,
                    'phone_number': p.phone_number
                } for p in results
            ]
        }
    )


@app.route("/api/patients/add", methods=['POST'])
@token_required
def add_patient(current_user):

    data = request.get_json()

    new_patient = Patients(
        name = data['name'],
        surname = data['surname'],
        dob = data['dob'],
        national_id = data['nationalId'],
        phone_number = data['phoneNumber'],
        address = data['address'],
        district = data['district'],
        province = data['province'],
        skin_color = data.get('skinColor', ''),
        disability_status = data.get('disability', 'able'),
        blood_group = data['bloodGroup'],
        next_of_kin = data['nextOfKin'],
        next_of_kin_phone = data.get('nextOfKinPhone', ''),
        next_of_kin_address = data.get('nextOfKinAddress', ''),
        dna_scan_id = data.get('dnaScanId', '')
    )

    try:

        db.session.add(new_patient)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Patient registered successfully',
                'patient_id': new_patient.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to register patient',
                'reason': f'{error}'
            }
        )


@app.route("/api/patients/<int:patient_id>", methods=['GET'])
@token_required
def get_patient(current_user, patient_id):

    patient = Patients.query.filter_by(id = patient_id).first()

    if not patient:
        return jsonify({'status': False, 'message': 'Patient not found'}), 404

    return jsonify(
        {
            'status': True,
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'surname': patient.surname,
                'dob': patient.dob,
                'national_id': patient.national_id,
                'phone_number': patient.phone_number,
                'address': patient.address,
                'district': patient.district,
                'province': patient.province,
                'skin_color': patient.skin_color,
                'disability_status': patient.disability_status,
                'blood_group': patient.blood_group,
                'next_of_kin': patient.next_of_kin,
                'next_of_kin_phone': patient.next_of_kin_phone,
                'next_of_kin_address': patient.next_of_kin_address,
                'allergies': patient.allergies,
                'chronic_conditions': patient.chronic_conditions,
                'current_medications': patient.current_medications,
                'immunizations': patient.immunizations
            }
        }
    )


@app.route("/api/patients/<int:patient_id>/update", methods=['PUT'])
@token_required
def update_patient(current_user, patient_id):

    patient = Patients.query.filter_by(id = patient_id).first()

    if not patient:
        return jsonify({'status': False, 'message': 'Patient not found'}), 404

    data = request.get_json()

    patient.name = data.get('name', patient.name)
    patient.surname = data.get('surname', patient.surname)
    patient.phone_number = data.get('phoneNumber', patient.phone_number)
    patient.allergies = data.get('allergies', patient.allergies)
    patient.chronic_conditions = data.get('chronicConditions', patient.chronic_conditions)
    patient.current_medications = data.get('currentMedications', patient.current_medications)
    patient.immunizations = data.get('immunizations', patient.immunizations)
    patient.updated_at = datetime.utcnow()

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Patient profile updated successfully'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update patient profile',
                'reason': f'{error}'
            }
        )


# ============================================================
# APPOINTMENT ENDPOINTS
# Covers: Appointment booking form and appointments list
# ============================================================

@app.route("/api/appointments", methods=['GET'])
@token_required
def get_appointments(current_user):

    appointments = Appointments.query.order_by(Appointments.date_time.desc()).all()

    return jsonify(
        {
            'status': True,
            'appointments': [
                {
                    'id': a.id,
                    'patient_id': a.patient_id,
                    'doctor_id': a.doctor_id,
                    'department': a.department,
                    'date_time': str(a.date_time),
                    'reason': a.reason,
                    'priority': a.priority,
                    'appointment_type': a.appointment_type,
                    'status': a.status,
                    'payment_type': a.payment_type,
                    'payed': float(a.payed),
                    'total': float(a.total)
                } for a in appointments
            ]
        }
    )


@app.route("/api/appointments/add", methods=['POST'])
@token_required
def add_appointment(current_user):

    data = request.get_json()

    new_appointment = Appointments(
        patient_id = data['patientId'],
        doctor_id = data.get('doctorId'),
        department = data.get('department', ''),
        date_time = datetime.fromisoformat(f"{data['date']}T{data['time']}"),
        reason = data['reason'],
        priority = data.get('priority', 'Normal'),
        appointment_type = data.get('type', 'First Visit'),
        status = 'scheduled',
        note = data.get('reason', ''),
        payed = 0,
        total = 0,
        payment_type = 'cash'
    )

    try:

        db.session.add(new_appointment)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Appointment booked successfully',
                'appointment_id': new_appointment.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to book appointment',
                'reason': f'{error}'
            }
        )


@app.route("/api/appointments/<int:appointment_id>/status", methods=['PUT'])
@token_required
def update_appointment_status(current_user, appointment_id):

    appointment = Appointments.query.filter_by(id = appointment_id).first()

    if not appointment:
        return jsonify({'status': False, 'message': 'Appointment not found'}), 404

    data = request.get_json()
    appointment.status = data['status']

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Appointment status updated'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update appointment status',
                'reason': f'{error}'
            }
        )


# ============================================================
# PAYMENT ENDPOINTS
# Covers: Payment management list and status/method updates
# ============================================================

@app.route("/api/payments", methods=['GET'])
@token_required
def get_payments(current_user):

    payments = Payments.query.order_by(Payments.created_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'payments': [
                {
                    'id': p.id,
                    'patient_id': p.patient_id,
                    'appointment_id': p.appointment_id,
                    'service': p.service,
                    'amount': float(p.amount),
                    'payment_method': p.payment_method,
                    'status': p.status
                } for p in payments
            ]
        }
    )


@app.route("/api/payments/<int:payment_id>", methods=['PUT'])
@token_required
def update_payment(current_user, payment_id):

    payment = Payments.query.filter_by(id = payment_id).first()

    if not payment:
        return jsonify({'status': False, 'message': 'Payment record not found'}), 404

    data = request.get_json()

    payment.status = data.get('status', payment.status)
    payment.payment_method = data.get('paymentMethod', payment.payment_method)
    payment.updated_at = datetime.utcnow()

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Payment record updated'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update payment record',
                'reason': f'{error}'
            }
        )


# ============================================================
# TRIAGE ENDPOINTS
# Covers: Triage & Vitals recording form and triage records list
# ============================================================

@app.route("/api/triage", methods=['GET'])
@token_required
def get_triage(current_user):

    records = Triage.query.order_by(Triage.recorded_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'triage_records': [
                {
                    'id': t.id,
                    'patient_id': t.patient_id,
                    'nurse_id': t.nurse_id,
                    'bp_systolic': t.bp_systolic,
                    'bp_diastolic': t.bp_diastolic,
                    'temperature': float(t.temperature),
                    'pulse': t.pulse,
                    'respiratory_rate': t.respiratory_rate,
                    'weight': float(t.weight) if t.weight else None,
                    'height': float(t.height) if t.height else None,
                    'oxygen_saturation': float(t.oxygen_saturation) if t.oxygen_saturation else None,
                    'blood_sugar': float(t.blood_sugar) if t.blood_sugar else None,
                    'priority': t.priority,
                    'chief_complaint': t.chief_complaint,
                    'symptoms': t.symptoms,
                    'notes': t.notes,
                    'recorded_at': str(t.recorded_at)
                } for t in records
            ]
        }
    )


@app.route("/api/triage/add", methods=['POST'])
@token_required
def add_triage(current_user):

    data = request.get_json()

    new_triage = Triage(
        patient_id = data['patientId'],
        nurse_id = current_user.id,
        bp_systolic = data['bpSystolic'],
        bp_diastolic = data['bpDiastolic'],
        temperature = data['temperature'],
        pulse = data['pulse'],
        respiratory_rate = data['respiratoryRate'],
        weight = data.get('weight'),
        height = data.get('height'),
        oxygen_saturation = data.get('oxygenSaturation'),
        blood_sugar = data.get('bloodSugar'),
        priority = data['priority'],
        chief_complaint = data['chiefComplaint'],
        symptoms = data.get('symptoms', ''),
        notes = data.get('notes', '')
    )

    try:

        db.session.add(new_triage)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Triage record saved successfully',
                'triage_id': new_triage.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to save triage record',
                'reason': f'{error}'
            }
        )


# ============================================================
# BED STATUS ENDPOINTS
# Covers: Bed Status management module
# ============================================================

@app.route("/api/beds", methods=['GET'])
@token_required
def get_beds(current_user):

    beds = Beds.query.order_by(Beds.ward, Beds.number).all()

    return jsonify(
        {
            'status': True,
            'beds': [
                {
                    'id': b.id,
                    'number': b.number,
                    'ward': b.ward,
                    'status': b.status,
                    'patient_id': b.patient_id
                } for b in beds
            ]
        }
    )


# ============================================================
# QUEUE MANAGEMENT ENDPOINTS
# Covers: Queue management for patient flow
# ============================================================

@app.route("/api/queue", methods=['GET'])
@token_required
def get_queue(current_user):

    items = QueueItem.query.order_by(QueueItem.queue_number).all()

    return jsonify(
        {
            'status': True,
            'queue_items': [
                {
                    'id': q.id,
                    'queue_number': q.queue_number,
                    'patient_id': q.patient_id,
                    'department': q.department,
                    'reason': q.reason,
                    'priority': q.priority,
                    'status': q.status,
                    'check_in_time': str(q.check_in_time)
                } for q in items
            ]
        }
    )


@app.route("/api/queue/add", methods=['POST'])
@token_required
def add_queue_item(current_user):

    data = request.get_json()

    last_number = db.session.query(db.func.max(QueueItem.queue_number)).scalar() or 0
    next_number = last_number + 1

    new_item = QueueItem(
        queue_number = next_number,
        patient_id = data['patientId'],
        department = data.get('department', 'General'),
        reason = data.get('reason', ''),
        priority = data.get('priority', 'Normal'),
        status = data.get('status', 'waiting')
    )

    try:

        db.session.add(new_item)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Queue item added successfully',
                'queue_id': new_item.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to add queue item',
                'reason': f'{error}'
            }
        )


@app.route("/api/queue/<int:item_id>/status", methods=['PUT'])
@token_required
def update_queue_status(current_user, item_id):

    item = QueueItem.query.filter_by(id = item_id).first()

    if not item:
        return jsonify({'status': False, 'message': 'Queue item not found'}), 404

    data = request.get_json()
    item.status = data.get('status', item.status)

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Queue status updated'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update queue status',
                'reason': f'{error}'
            }
        )


@app.route("/api/queue/<int:item_id>", methods=['DELETE'])
@token_required
def delete_queue_item(current_user, item_id):

    item = QueueItem.query.filter_by(id = item_id).first()

    if not item:
        return jsonify({'status': False, 'message': 'Queue item not found'}), 404

    try:

        db.session.delete(item)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Queue item removed'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to remove queue item',
                'reason': f'{error}'
            }
        )

@app.route("/api/beds/<int:bed_id>/status", methods=['PUT'])
@token_required
def update_bed_status(current_user, bed_id):

    bed = Beds.query.filter_by(id = bed_id).first()

    if not bed:
        return jsonify({'status': False, 'message': 'Bed not found'}), 404

    data = request.get_json()
    bed.status = data['status']

    if data['status'] != 'occupied':
        bed.patient_id = None

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Bed status updated'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update bed status',
                'reason': f'{error}'
            }
        )


# ============================================================
# WARD ADMISSION ENDPOINTS
# Covers: Ward Management admission form and admissions list
# ============================================================

@app.route("/api/ward", methods=['GET'])
@token_required
def get_ward_admissions(current_user):

    admissions = WardAdmission.query.order_by(WardAdmission.admission_date.desc()).all()

    return jsonify(
        {
            'status': True,
            'ward_admissions': [
                {
                    'id': w.id,
                    'patient_id': w.patient_id,
                    'doctor_id': w.doctor_id,
                    'ward': w.ward,
                    'bed_number': w.bed_number,
                    'admission_date': str(w.admission_date),
                    'diagnosis': w.diagnosis,
                    'notes': w.notes,
                    'status': w.status
                } for w in admissions
            ]
        }
    )


@app.route("/api/ward/add", methods=['POST'])
@token_required
def add_ward_admission(current_user):

    data = request.get_json()

    new_admission = WardAdmission(
        patient_id = data['patientId'],
        doctor_id = data.get('doctorId'),
        ward = data['ward'],
        bed_number = data['bedNumber'],
        admission_date = datetime.fromisoformat(data['admissionDate']),
        diagnosis = data['diagnosis'],
        notes = data.get('notes', ''),
        status = 'admitted'
    )

    bed = Beds.query.filter_by(number = data['bedNumber']).first()
    if bed:
        bed.status = 'occupied'
        bed.patient_id = data['patientId']

    try:

        db.session.add(new_admission)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Patient admitted to ward successfully',
                'admission_id': new_admission.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to admit patient to ward',
                'reason': f'{error}'
            }
        )


@app.route("/api/ward/<int:admission_id>/discharge", methods=['PUT'])
@token_required
def discharge_ward_patient(current_user, admission_id):

    admission = WardAdmission.query.filter_by(id = admission_id).first()

    if not admission:
        return jsonify({'status': False, 'message': 'Ward admission not found'}), 404

    admission.status = 'discharged'
    admission.discharged_at = datetime.utcnow()

    bed = Beds.query.filter_by(number = admission.bed_number).first()
    if bed:
        bed.status = 'cleaning'
        bed.patient_id = None

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Patient discharged from ward'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to discharge patient',
                'reason': f'{error}'
            }
        )


# ============================================================
# CONSULTATION ENDPOINTS
# Covers: Doctor Consultation form and consultations list
# ============================================================

@app.route("/api/consultations", methods=['GET'])
@token_required
def get_consultations(current_user):

    consultations = Consultation.query.order_by(Consultation.created_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'consultations': [
                {
                    'id': c.id,
                    'patient_id': c.patient_id,
                    'doctor_id': c.doctor_id,
                    'chief_complaint': c.chief_complaint,
                    'symptom_duration': c.symptom_duration,
                    'severity': c.severity,
                    'working_diagnosis': c.working_diagnosis,
                    'status': c.status,
                    'created_at': str(c.created_at)
                } for c in consultations
            ]
        }
    )


@app.route("/api/consultations/add", methods=['POST'])
@token_required
def add_consultation(current_user):

    data = request.get_json()

    new_consultation = Consultation(
        patient_id = data['patientId'],
        doctor_id = current_user.id,
        chief_complaint = data['chiefComplaint'],
        symptom_duration = data['symptomDuration'],
        severity = data['severity'],
        history_present = data['historyPresent'],
        associated_symptoms = data.get('associatedSymptoms', ''),
        previous_illnesses = data.get('previousIllnesses', ''),
        surgical_history = data.get('surgicalHistory', ''),
        current_medications = data.get('currentMedications', ''),
        allergies = data.get('allergies', ''),
        exam_bp = data.get('examination', {}).get('bp', ''),
        exam_heart_rate = data.get('examination', {}).get('heartRate', ''),
        exam_temperature = data.get('examination', {}).get('temperature', ''),
        exam_respiratory_rate = data.get('examination', {}).get('respiratoryRate', ''),
        exam_spo2 = data.get('examination', {}).get('spo2', ''),
        exam_weight = data.get('examination', {}).get('weight', ''),
        exam_findings = data['examination']['findings'],
        working_diagnosis = data['workingDiagnosis'],
        clinical_notes = data.get('clinicalNotes', ''),
        status = 'waiting'
    )

    try:

        db.session.add(new_consultation)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Consultation saved successfully',
                'consultation_id': new_consultation.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to save consultation',
                'reason': f'{error}'
            }
        )


# ============================================================
# DIAGNOSIS ENDPOINTS
# Covers: Diagnosis & Clinical Notes form and diagnosis records list
# ============================================================

@app.route("/api/diagnoses", methods=['GET'])
@token_required
def get_diagnoses(current_user):

    diagnoses = Diagnosis.query.order_by(Diagnosis.created_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'diagnoses': [
                {
                    'id': d.id,
                    'patient_id': d.patient_id,
                    'doctor_id': d.doctor_id,
                    'primary_diagnosis': d.primary_diagnosis,
                    'icd_code': d.icd_code,
                    'diagnosis_type': d.diagnosis_type,
                    'severity': d.severity,
                    'prognosis': d.prognosis,
                    'created_at': str(d.created_at)
                } for d in diagnoses
            ]
        }
    )


@app.route("/api/diagnoses/add", methods=['POST'])
@token_required
def add_diagnosis(current_user):

    data = request.get_json()

    new_diagnosis = Diagnosis(
        patient_id = data['patientId'],
        doctor_id = current_user.id,
        primary_diagnosis = data['primaryDiagnosis'],
        icd_code = data.get('icdCode', ''),
        secondary_diagnosis = data.get('secondaryDiagnosis', ''),
        diagnosis_type = data['diagnosisType'],
        severity = data.get('severity', ''),
        clinical_assessment = data['clinicalAssessment'],
        supporting_evidence = data.get('supportingEvidence', ''),
        additional_notes = data.get('additionalNotes', ''),
        treatment_plan = data['treatmentPlan'],
        prognosis = data.get('prognosis', ''),
        follow_up_instructions = data.get('followUpInstructions', '')
    )

    try:

        db.session.add(new_diagnosis)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Diagnosis saved successfully',
                'diagnosis_id': new_diagnosis.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to save diagnosis',
                'reason': f'{error}'
            }
        )


# ============================================================
# LAB ORDER ENDPOINTS
# Covers: Laboratory Order form and lab orders list
# ============================================================

@app.route("/api/lab-orders", methods=['GET'])
@token_required
def get_lab_orders(current_user):

    orders = LabOrder.query.order_by(LabOrder.created_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'lab_orders': [
                {
                    'id': o.id,
                    'patient_id': o.patient_id,
                    'doctor_id': o.doctor_id,
                    'test_category': o.test_category,
                    'tests_ordered': o.tests_ordered,
                    'priority': o.priority,
                    'expected_date': str(o.expected_date) if o.expected_date else None,
                    'clinical_indication': o.clinical_indication,
                    'provisional_diagnosis': o.provisional_diagnosis,
                    'status': o.status,
                    'created_at': str(o.created_at)
                } for o in orders
            ]
        }
    )


@app.route("/api/lab-orders/add", methods=['POST'])
@token_required
def add_lab_order(current_user):

    data = request.get_json()

    new_order = LabOrder(
        patient_id = data['patientId'],
        doctor_id = current_user.id,
        test_category = data['testCategory'],
        tests_ordered = data['testsOrdered'],
        priority = data['priority'],
        expected_date = datetime.fromisoformat(data['expectedDate']).date() if data.get('expectedDate') else None,
        clinical_indication = data['clinicalIndication'],
        provisional_diagnosis = data.get('provisionalDiagnosis', ''),
        special_instructions = data.get('specialInstructions', ''),
        status = 'pending'
    )

    try:

        db.session.add(new_order)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Lab order submitted successfully',
                'order_id': new_order.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to submit lab order',
                'reason': f'{error}'
            }
        )


# ============================================================
# DRUG ORDER (PRESCRIPTION) ENDPOINTS
# Covers: Drug Prescription form, prescriptions list
# ============================================================

@app.route("/api/drug-orders", methods=['GET'])
@token_required
def get_drug_orders(current_user):

    orders = DrugOrder.query.order_by(DrugOrder.created_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'drug_orders': [
                {
                    'id': o.id,
                    'patient_id': o.patient_id,
                    'doctor_id': o.doctor_id,
                    'drug_name': o.drug_name,
                    'strength': o.strength,
                    'form': o.form,
                    'route': o.route,
                    'frequency': o.frequency,
                    'duration': o.duration,
                    'quantity': o.quantity,
                    'indication': o.indication,
                    'refillable': o.refillable,
                    'refills': o.refills,
                    'status': o.status,
                    'created_at': str(o.created_at)
                } for o in orders
            ]
        }
    )


@app.route("/api/drug-orders/add", methods=['POST'])
@token_required
def add_drug_order(current_user):

    data = request.get_json()

    new_order = DrugOrder(
        patient_id = data['patientId'],
        doctor_id = current_user.id,
        drug_name = data['drugName'],
        strength = data['strength'],
        form = data['form'],
        route = data['route'],
        frequency = data['frequency'],
        duration = data['duration'],
        quantity = data['quantity'],
        instructions = data['instructions'],
        indication = data['indication'],
        refillable = data.get('refillable', False),
        refills = data.get('refills', 0),
        precautions = data.get('precautions', ''),
        status = 'active'
    )

    try:

        db.session.add(new_order)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Prescription issued successfully',
                'order_id': new_order.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to issue prescription',
                'reason': f'{error}'
            }
        )


# ============================================================
# ADMISSION (DOCTOR MODULE) ENDPOINTS
# Covers: Patient Admission form, admissions list, discharge
# ============================================================

@app.route("/api/admissions", methods=['GET'])
@token_required
def get_admissions(current_user):

    admissions = Admission.query.order_by(Admission.admission_date_time.desc()).all()

    return jsonify(
        {
            'status': True,
            'admissions': [
                {
                    'id': a.id,
                    'patient_id': a.patient_id,
                    'doctor_id': a.doctor_id,
                    'admission_date_time': str(a.admission_date_time),
                    'admission_type': a.admission_type,
                    'ward': a.ward,
                    'bed_number': a.bed_number,
                    'admitting_diagnosis': a.admitting_diagnosis,
                    'attending_physician': a.attending_physician,
                    'severity': a.severity,
                    'status': a.status,
                    'discharge_date': str(a.discharge_date) if a.discharge_date else None
                } for a in admissions
            ]
        }
    )


@app.route("/api/admissions/add", methods=['POST'])
@token_required
def add_admission(current_user):

    data = request.get_json()

    new_admission = Admission(
        patient_id = data['patientId'],
        doctor_id = current_user.id,
        admission_date_time = datetime.fromisoformat(data['admissionDateTime']),
        admission_type = data['admissionType'],
        ward = data['ward'],
        bed_number = data.get('bedNumber', ''),
        reason_for_admission = data['reasonForAdmission'],
        admitting_diagnosis = data['admittingDiagnosis'],
        attending_physician = data['attendingPhysician'],
        expected_duration = data.get('expectedDuration', ''),
        severity = data.get('severity', ''),
        treatment_plan = data.get('treatmentPlan', ''),
        special_instructions = data.get('specialInstructions', ''),
        status = 'admitted'
    )

    try:

        db.session.add(new_admission)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Patient admitted successfully',
                'admission_id': new_admission.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to admit patient',
                'reason': f'{error}'
            }
        )


@app.route("/api/admissions/<int:admission_id>/discharge", methods=['PUT'])
@token_required
def initiate_discharge(current_user, admission_id):

    admission = Admission.query.filter_by(id = admission_id).first()

    if not admission:
        return jsonify({'status': False, 'message': 'Admission record not found'}), 404

    admission.status = 'pending-discharge'

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Discharge initiated'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to initiate discharge',
                'reason': f'{error}'
            }
        )


@app.route("/api/admissions/<int:admission_id>/complete-discharge", methods=['PUT'])
@token_required
def complete_discharge(current_user, admission_id):

    admission = Admission.query.filter_by(id = admission_id).first()

    if not admission:
        return jsonify({'status': False, 'message': 'Admission record not found'}), 404

    admission.status = 'discharged'
    admission.discharge_date = datetime.utcnow()

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Patient discharged successfully'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to complete discharge',
                'reason': f'{error}'
            }
        )


# ============================================================
# INVENTORY ENDPOINTS
# Covers: Stock Inventory full CRUD (add, edit, delete, list)
# ============================================================

@app.route("/api/inventory", methods=['GET'])
@token_required
def get_inventory(current_user):

    items = Inventory.query.order_by(Inventory.drug_name).all()

    return jsonify(
        {
            'status': True,
            'inventory': [
                {
                    'id': i.id,
                    'drug_name': i.drug_name,
                    'generic_name': i.generic_name,
                    'strength': i.strength,
                    'form': i.form,
                    'category': i.category,
                    'manufacturer': i.manufacturer,
                    'quantity': i.quantity,
                    'reorder_level': i.reorder_level,
                    'unit_of_measure': i.unit_of_measure,
                    'batch_number': i.batch_number,
                    'expiry_date': str(i.expiry_date),
                    'location': i.location,
                    'unit_price': float(i.unit_price),
                    'selling_price': float(i.selling_price),
                    'supplier': i.supplier,
                    'prescription_required': i.prescription_required
                } for i in items
            ]
        }
    )


@app.route("/api/inventory/add", methods=['POST'])
@token_required
def add_inventory_item(current_user):

    data = request.get_json()

    new_item = Inventory(
        drug_name = data['drugName'],
        generic_name = data.get('genericName', ''),
        strength = data['strength'],
        form = data['form'],
        category = data.get('category', ''),
        manufacturer = data.get('manufacturer', ''),
        quantity = data['quantity'],
        reorder_level = data['reorderLevel'],
        unit_of_measure = data.get('unitOfMeasure', 'Pieces'),
        batch_number = data['batchNumber'],
        expiry_date = datetime.fromisoformat(data['expiryDate']).date(),
        location = data.get('location', ''),
        unit_price = data['unitPrice'],
        selling_price = data['sellingPrice'],
        supplier = data.get('supplier', ''),
        supplier_contact = data.get('supplierContact', ''),
        prescription_required = data.get('prescriptionRequired', False),
        storage_conditions = data.get('storageConditions', ''),
        notes = data.get('notes', '')
    )

    try:

        db.session.add(new_item)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Inventory item added successfully',
                'item_id': new_item.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to add inventory item',
                'reason': f'{error}'
            }
        )


@app.route("/api/inventory/<int:item_id>", methods=['PUT'])
@token_required
def update_inventory_item(current_user, item_id):

    item = Inventory.query.filter_by(id = item_id).first()

    if not item:
        return jsonify({'status': False, 'message': 'Inventory item not found'}), 404

    data = request.get_json()

    item.drug_name = data.get('drugName', item.drug_name)
    item.generic_name = data.get('genericName', item.generic_name)
    item.strength = data.get('strength', item.strength)
    item.form = data.get('form', item.form)
    item.category = data.get('category', item.category)
    item.manufacturer = data.get('manufacturer', item.manufacturer)
    item.quantity = data.get('quantity', item.quantity)
    item.reorder_level = data.get('reorderLevel', item.reorder_level)
    item.unit_of_measure = data.get('unitOfMeasure', item.unit_of_measure)
    item.batch_number = data.get('batchNumber', item.batch_number)
    item.expiry_date = datetime.fromisoformat(data['expiryDate']).date() if data.get('expiryDate') else item.expiry_date
    item.location = data.get('location', item.location)
    item.unit_price = data.get('unitPrice', item.unit_price)
    item.selling_price = data.get('sellingPrice', item.selling_price)
    item.supplier = data.get('supplier', item.supplier)
    item.supplier_contact = data.get('supplierContact', item.supplier_contact)
    item.prescription_required = data.get('prescriptionRequired', item.prescription_required)
    item.storage_conditions = data.get('storageConditions', item.storage_conditions)
    item.notes = data.get('notes', item.notes)
    item.updated_at = datetime.utcnow()

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Inventory item updated successfully'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update inventory item',
                'reason': f'{error}'
            }
        )


@app.route("/api/inventory/<int:item_id>", methods=['DELETE'])
@token_required
def delete_inventory_item(current_user, item_id):

    item = Inventory.query.filter_by(id = item_id).first()

    if not item:
        return jsonify({'status': False, 'message': 'Inventory item not found'}), 404

    try:

        db.session.delete(item)
        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Inventory item deleted successfully'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to delete inventory item',
                'reason': f'{error}'
            }
        )


# ============================================================
# DISPENSING ENDPOINTS
# Covers: Dispensing form (OTC + prescription), dispensing
# records list, and prescription status update (mark dispensed)
# ============================================================

@app.route("/api/dispensing", methods=['GET'])
@token_required
def get_dispensing_records(current_user):

    records = Dispensing.query.order_by(Dispensing.dispensed_at.desc()).all()

    return jsonify(
        {
            'status': True,
            'dispensing_records': [
                {
                    'id': d.id,
                    'type': d.type,
                    'patient_id': d.patient_id,
                    'patient_name': d.patient_name,
                    'drug_order_id': d.drug_order_id,
                    'payment_method': d.payment_method,
                    'total_amount': float(d.total_amount),
                    'dispensed_by_id': d.dispensed_by_id,
                    'dispensed_at': str(d.dispensed_at),
                    'items': [
                        {
                            'inventory_id': i.inventory_id,
                            'quantity': i.quantity,
                            'unit_price': float(i.unit_price),
                            'total': float(i.total)
                        } for i in d.items
                    ]
                } for d in records
            ]
        }
    )


@app.route("/api/dispensing/add", methods=['POST'])
@token_required
def add_dispensing_record(current_user):

    data = request.get_json()

    total_amount = sum(
        item['quantity'] * item['unitPrice'] for item in data.get('items', [])
    )

    new_dispensing = Dispensing(
        type = data.get('type', 'otc'),
        patient_id = data.get('patientId'),
        patient_name = data.get('patientName', ''),
        drug_order_id = data.get('drugOrderId'),
        payment_method = data['paymentMethod'],
        instructions = data.get('instructions', ''),
        total_amount = total_amount,
        dispensed_by_id = current_user.id
    )

    try:

        db.session.add(new_dispensing)
        db.session.flush()

        for item_data in data.get('items', []):
            dispensing_item = DispensingItem(
                dispensing_id = new_dispensing.id,
                inventory_id = item_data['itemId'],
                quantity = item_data['quantity'],
                unit_price = item_data['unitPrice'],
                total = item_data['quantity'] * item_data['unitPrice']
            )
            db.session.add(dispensing_item)

            inventory_item = Inventory.query.filter_by(id = item_data['itemId']).first()
            if inventory_item:
                inventory_item.quantity -= item_data['quantity']

        if data.get('drugOrderId'):
            prescription = DrugOrder.query.filter_by(id = data['drugOrderId']).first()
            if prescription:
                prescription.status = 'dispensed'

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Dispensing record saved successfully',
                'dispensing_id': new_dispensing.id
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to save dispensing record',
                'reason': f'{error}'
            }
        )


@app.route("/api/drug-orders/<int:order_id>/mark-dispensed", methods=['PUT'])
@token_required
def mark_prescription_dispensed(current_user, order_id):

    order = DrugOrder.query.filter_by(id = order_id).first()

    if not order:
        return jsonify({'status': False, 'message': 'Prescription not found'}), 404

    order.status = 'dispensed'

    try:

        db.session.commit()

        return jsonify(
            {
                'status': True,
                'message': 'Prescription marked as dispensed'
            }
        )

    except Exception as error:

        db.session.rollback()
        return jsonify(
            {
                'status': False,
                'message': 'Failed to update prescription status',
                'reason': f'{error}'
            }
        )
