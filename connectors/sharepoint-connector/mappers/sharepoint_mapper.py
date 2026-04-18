from common.models.canonical.content_item import ContentItem

def map_sharepoint_item(sp_item):
    return ContentItem(
        contentId=sp_item["UniqueId"],
        title=sp_item["Name"],
        contentType=sp_item["ContentType"]["Name"],
        sourceSystemId="sharepoint",
        uri=sp_item["ServerRelativeUrl"],
        status="Active",
        createdAt=sp_item["TimeCreated"],
        updatedAt=sp_item["TimeLastModified"],
        owner=sp_item["Author"]["Email"],
        metadata=sp_item["Fields"]
    )