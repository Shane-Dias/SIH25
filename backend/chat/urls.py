from django.urls import path
from .views import MessageListCreateView, get_recent_messages

urlpatterns = [
    path('messages/', MessageListCreateView.as_view(), name='messages'),
    path('messages/recent/', get_recent_messages, name='recent-messages'),
]