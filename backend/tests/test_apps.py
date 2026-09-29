"""
Student ERP — Backend Foundation Tests: App Registry
Verifies that all domain apps and the common utility app are successfully registered in Django's app registry.
"""

from django.apps import apps


def test_common_app_registered():
    """Verify common app is registered with CommonConfig."""
    app_config = apps.get_app_config('common')
    assert app_config is not None
    assert app_config.name == 'common'


def test_all_11_domain_apps_registered():
    """Verify each of the 11 domain apps is registered in the Django app registry."""
    domain_app_labels = [
        'accounts',
        'students',
        'academics',
        'attendance',
        'marks',
        'timetable',
        'calendar',
        'allocation',
        'reports',
        'notifications',
        'audit',
    ]

    for label in domain_app_labels:
        app_config = apps.get_app_config(label)
        assert app_config is not None, f"Domain app '{label}' is not registered in Django apps"
        assert app_config.name == f"apps.{label}"


def test_no_missing_or_duplicate_app_configs():
    """Verify total number of loaded app configs matches expectation."""
    registered_names = [config.name for config in apps.get_app_configs()]
    assert 'common' in registered_names
    assert 'apps.accounts' in registered_names
    assert 'apps.students' in registered_names
    assert 'apps.academics' in registered_names
    assert 'apps.attendance' in registered_names
    assert 'apps.marks' in registered_names
    assert 'apps.timetable' in registered_names
    assert 'apps.calendar' in registered_names
    assert 'apps.allocation' in registered_names
    assert 'apps.reports' in registered_names
    assert 'apps.notifications' in registered_names
    assert 'apps.audit' in registered_names
