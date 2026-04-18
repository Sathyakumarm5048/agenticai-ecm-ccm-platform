from common.models.canonical.content_item import ContentItem

def analyze_content(content: ContentItem):
    if content.contentType == "Invoice" and content.metadata.get("Amount") > 10000:
        return "HighValueInvoice"