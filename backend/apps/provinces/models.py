from django.db import models

from apps.core.models import BaseModel


class Province(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.name


class District(BaseModel):
    province = models.ForeignKey(
        Province, related_name='districts', on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ['name']
        unique_together = ('province', 'name')

    def __str__(self):
        return f'{self.name}, {self.province.name}'


class Town(BaseModel):
    district = models.ForeignKey(
        District, related_name='towns', on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ['name']
        unique_together = ('district', 'name')

    @property
    def province(self):
        return self.district.province

    def __str__(self):
        return f'{self.name}, {self.district.name}'
