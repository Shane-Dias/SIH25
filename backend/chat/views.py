from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from .models import Message
from .serializers import MessageSerializer

class MessageListCreateView(generics.ListCreateAPIView):
    queryset = Message.objects.all().order_by('-timestamp')[:50]  # Last 50 messages
    serializer_class = MessageSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().order_by('timestamp')  # Oldest first for display
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def get_recent_messages(request):
    """Get messages newer than a specific timestamp"""
    timestamp = request.GET.get('timestamp')
    if timestamp:
        messages = Message.objects.filter(timestamp__gt=timestamp).order_by('timestamp')
    else:
        messages = Message.objects.all().order_by('timestamp')[:50]
    
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)