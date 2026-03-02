from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
# from flask_mail import Mail


app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://192.168.1.105",
            "http://localhost",
            "http://127.0.0.1",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/medcore'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = "medcore/static/uploads"
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['ALLOWED_EXTENSIONS'] = ('pdf', 'doc', 'docx')
app.config['TIMEZONE'] = 'Africa/Harare'
app.config['MAIL_SERVER'] = 'mail.your-domain.co.zw'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = 'noreply@your-domain.co.zw'
app.config['MAIL_PASSWORD'] = 'your-password'
app.config['MAIL_DEFAULT_SENDER'] = ('YourName', 'noreply@your-domain.co.zw')

# mail = Mail(app)

app.app_context()
db = SQLAlchemy(app)
migrate = Migrate(app, db, render_as_batch = True)

from medcore.api import endpoints
