from django.contrib import admin

from .models import DailyProgressEntry, ProgressTaskTemplate, SiteProgressTask


@admin.register(ProgressTaskTemplate)
class ProgressTaskTemplateAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'category', 'unit', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('key', 'name')


@admin.register(SiteProgressTask)
class SiteProgressTaskAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'site', 'category', 'unit', 'planned_quantity', 'is_active')
    list_filter = ('category', 'is_active', 'site')
    search_fields = ('key', 'name', 'site__name')


@admin.register(DailyProgressEntry)
class DailyProgressEntryAdmin(admin.ModelAdmin):
    list_display = ('date', 'site', 'site_task', 'quantity', 'submitted_by')
    list_filter = ('date', 'site')
    search_fields = ('site_task__key', 'site_task__name', 'remarks')
