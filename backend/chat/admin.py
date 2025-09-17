from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['username', 'content', 'timestamp']
    list_filter = ['timestamp', 'username']
    search_fields = ['username', 'content']
    readonly_fields = ['timestamp']