"""
Student ERP — Calendar DRF Serializers (Phase 6 Task 6.2)
Serializer-layer contract for academic calendar events.
"""

from rest_framework import serializers
from common.constants import ALL_ROLES
from apps.calendar.models import (
    CalendarEvent,
    CALENDAR_CATEGORIES,
    normalize_category,
)


class CalendarEventSerializer(serializers.ModelSerializer):
    """
    Read-only presentation serializer for CalendarEvent instances.
    Exposes canonical fields along with convenience properties (od_eligible, is_public).
    """
    od_eligible = serializers.BooleanField(source='is_school_sanctioned', read_only=True)
    is_public = serializers.BooleanField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model = CalendarEvent
        fields = [
            'id',
            'title',
            'category',
            'description',
            'start_date',
            'end_date',
            'target_roles',
            'location',
            'is_holiday',
            'is_published',
            'is_school_sanctioned',
            'od_eligible',
            'is_public',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class CalendarEventWriteSerializer(serializers.ModelSerializer):
    """
    Validation and deserialization serializer for creating and updating calendar events.
    """
    od_eligible = serializers.BooleanField(required=False, write_only=True)

    class Meta:
        model = CalendarEvent
        fields = [
            'title',
            'category',
            'description',
            'start_date',
            'end_date',
            'target_roles',
            'location',
            'is_holiday',
            'is_published',
            'is_school_sanctioned',
            'od_eligible',
        ]
        extra_kwargs = {
            'description': {'required': False, 'allow_blank': True},
            'location': {'required': False, 'allow_blank': True},
            'target_roles': {'required': False},
            'is_holiday': {'required': False},
            'is_published': {'required': False},
            'is_school_sanctioned': {'required': False},
        }

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Title is required and cannot be blank.")
        return value.strip()

    def validate_category(self, value):
        if not value:
            raise serializers.ValidationError("Category is required.")
        norm = normalize_category(value)
        if norm not in CALENDAR_CATEGORIES:
            raise serializers.ValidationError(
                f"Invalid category '{value}'. Must be one of {list(CALENDAR_CATEGORIES)}."
            )
        return norm

    def validate_target_roles(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("target_roles must be a list of canonical role names.")
        invalid = [r for r in value if r not in ALL_ROLES]
        if invalid:
            raise serializers.ValidationError(
                f"Invalid target roles: {invalid}. Must be one of {list(ALL_ROLES)}."
            )
        # Deduplicate while preserving order
        return list(dict.fromkeys(value))

    def validate(self, attrs):
        start = attrs.get('start_date') or (self.instance.start_date if self.instance else None)
        end = attrs.get('end_date') or (self.instance.end_date if self.instance else None)
        if start and end and start > end:
            raise serializers.ValidationError({
                'end_date': "End date must not precede start date."
            })

        # Synchronize od_eligible and is_school_sanctioned
        if 'od_eligible' in attrs:
            attrs['is_school_sanctioned'] = attrs.pop('od_eligible')

        # Auto-set is_holiday if category is holiday
        cat = attrs.get('category') or (self.instance.category if self.instance else None)
        if cat == 'holiday' and 'is_holiday' not in attrs:
            attrs['is_holiday'] = True

        return attrs
