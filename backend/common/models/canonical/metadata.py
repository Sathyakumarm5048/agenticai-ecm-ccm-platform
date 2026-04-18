from pydantic import BaseModel
from typing import Any, Optional
from enum import Enum


class MetadataType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    ENUM = "enum"
    JSON = "json"


class MetadataField(BaseModel):
    key: str
    value: Any
    dataType: MetadataType
    isIndexed: bool = False
    isPII: bool = False
    source: Optional[str] = None  # e.g., "SharePoint", "Exstream"