"""
Student ERP — Backend Foundation Tests: Settings & Configuration
Verifies Django settings, middleware, installed apps, and DRF baseline configuration.
"""

from django.conf import settings


def test_settings_loaded():
    """Verify that Django settings are loaded properly."""
    assert settings.configured is True
    assert hasattr(settings, 'SECRET_KEY')
    assert len(settings.SECRET_KEY) > 0


def test_installed_apps_contain_all_approved_apps():
    """Verify that Django, third-party, and all local domain apps are in INSTALLED_APPS."""
    installed_apps = settings.INSTALLED_APPS

    # Core Django apps
    assert 'django.contrib.admin' in installed_apps
    assert 'django.contrib.auth' in installed_apps
    assert 'django.contrib.contenttypes' in installed_apps
    assert 'django.contrib.sessions' in installed_apps
    assert 'django.contrib.messages' in installed_apps
    assert 'django.contrib.staticfiles' in installed_apps

    # Approved third-party apps
    assert 'rest_framework' in installed_apps
    assert 'rest_framework_simplejwt' in installed_apps
    assert 'corsheaders' in installed_apps
    assert 'channels' in installed_apps

    # Approved local apps
    assert 'common' in installed_apps
    expected_domain_apps = [
        'apps.accounts',
        'apps.students',
        'apps.academics',
        'apps.attendance',
        'apps.marks',
        'apps.timetable',
        'apps.calendar',
        'apps.allocation',
        'apps.reports',
        'apps.notifications',
        'apps.audit',
    ]
    for app in expected_domain_apps:
        assert app in installed_apps, f"Expected app {app} not found in INSTALLED_APPS"


def test_middleware_configured():
    """Verify standard middleware and CORS middleware are present in correct order."""
    middleware = settings.MIDDLEWARE
    assert 'corsheaders.middleware.CorsMiddleware' in middleware
    assert 'django.middleware.security.SecurityMiddleware' in middleware
    assert 'django.contrib.sessions.middleware.SessionMiddleware' in middleware
    assert 'django.middleware.common.CommonMiddleware' in middleware
    assert 'django.contrib.auth.middleware.AuthenticationMiddleware' in middleware


def test_drf_configuration():
    """Verify Django REST Framework settings adhere to architectural standards."""
    drf_settings = settings.REST_FRAMEWORK
    assert drf_settings is not None
    assert 'DEFAULT_AUTHENTICATION_CLASSES' in drf_settings
    assert 'rest_framework_simplejwt.authentication.JWTAuthentication' in drf_settings['DEFAULT_AUTHENTICATION_CLASSES']
    assert drf_settings.get('DEFAULT_PAGINATION_CLASS') == 'common.pagination.StandardResultsSetPagination'
    assert drf_settings.get('PAGE_SIZE') == 20
    assert drf_settings.get('EXCEPTION_HANDLER') == 'common.exceptions.custom_exception_handler'


def test_database_configuration_structure():
    """Verify default database uses postgresql engine and includes required keys."""
    default_db = settings.DATABASES['default']
    assert default_db['ENGINE'] == 'django.db.backends.postgresql'
    assert 'NAME' in default_db
    assert 'USER' in default_db
    assert 'PASSWORD' in default_db
    assert 'HOST' in default_db
    assert 'PORT' in default_db


def test_logging_configuration():
    """Verify standard development logging configuration exists."""
    assert hasattr(settings, 'LOGGING')
    logging_config = settings.LOGGING
    assert logging_config['version'] == 1
    assert 'console' in logging_config.get('handlers', {})
