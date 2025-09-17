from django.db import models
from django.utils import timezone

class Photo(models.Model):
    title = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to='photos/')
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Photo {self.id} - {self.title}"
    
    class Meta:
        ordering = ['-uploaded_at']