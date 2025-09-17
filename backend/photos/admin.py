from django.contrib import admin
from .models import Photo

@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'uploaded_at']
    list_filter = ['uploaded_at']
    readonly_fields = ['uploaded_at']