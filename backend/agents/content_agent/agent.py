"""
Content Agent - understands and classifies content.
"""
from typing import Dict, List, Any, Optional
from enum import Enum
import logging

from common.agents.base_agent import BaseAgent, Guardrail, Tool, ActionScope
from common.tools.base_tools import APIClient, AuditLogger

logger = logging.getLogger(__name__)


class SensitivityLevel(Enum):
    """Sensitivity levels for content."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class ContentAgent(BaseAgent):
    """Understands and classifies content."""

    def __init__(
        self,
        agent_name: str = "content-agent",
        content_api_url: str = "http://localhost:8004",
        audit_url: str = "http://localhost:8080/api/audit"
    ):
        # Define content agent guardrails
        guardrails = [
            Guardrail(
                name="content_scope",
                scope=ActionScope.READ_WRITE,
                allowed_systems=["content"],
                allowed_actions=["read", "classify", "extract", "detect", "update_metadata"],
                requires_compliance_check=True
            )
        ]

        super().__init__(
            agent_name=agent_name,
            agent_type="content",
            guardrails=guardrails
        )

        self.content_api = APIClient(content_api_url)
        self.audit_logger = AuditLogger(audit_url)

        # Register tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register all available tools."""
        self.register_tool(Tool(
            name="get_content_item",
            description="Retrieve a content item",
            func=self._tool_get_content_item,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="classify_content",
            description="Classify content by type and sensitivity",
            func=self._tool_classify_content,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="extract_metadata",
            description="Extract structured metadata from content",
            func=self._tool_extract_metadata,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="detect_pii",
            description="Detect personally identifiable information in content",
            func=self._tool_detect_pii,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="update_content_metadata",
            description="Update metadata for a content item",
            func=self._tool_update_content_metadata,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="suggest_taxonomy",
            description="Suggest taxonomy tags for content",
            func=self._tool_suggest_taxonomy,
            guardrails=[]
        ))

    def _tool_get_content_item(self, content_id: str) -> Dict:
        """Get a content item."""
        try:
            result = self.content_api.get(f"/content/{content_id}")
            logger.info(f"Retrieved content item {content_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to get content item: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_classify_content(self, content_id: str) -> Dict:
        """Classify content."""
        try:
            result = self.content_api.post(
                f"/content/{content_id}/classify",
                {}
            )
            logger.info(f"Classified content {content_id}")
            return result
        except Exception as e:
            logger.error(f"Content classification failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_extract_metadata(self, content_id: str) -> Dict:
        """Extract metadata from content."""
        try:
            result = self.content_api.post(
                f"/content/{content_id}/extract-metadata",
                {}
            )
            logger.info(f"Extracted metadata from {content_id}")
            return result
        except Exception as e:
            logger.error(f"Metadata extraction failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_detect_pii(self, content_id: str) -> Dict:
        """Detect PII in content."""
        try:
            result = self.content_api.post(
                f"/content/{content_id}/detect-pii",
                {}
            )
            logger.info(f"Scanned {content_id} for PII")
            return result
        except Exception as e:
            logger.error(f"PII detection failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_update_content_metadata(self, content_id: str, metadata: Dict) -> Dict:
        """Update content metadata."""
        allowed, reason = self.can_execute_action("update_metadata", "content")
        if not allowed:
            return {"success": False, "error": reason}

        try:
            result = self.content_api.put(
                f"/content/{content_id}/metadata",
                metadata
            )
            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="content_metadata_updated",
                target=content_id,
                status="success",
                details={"metadata_keys": list(metadata.keys())}
            )
            logger.info(f"Updated metadata for {content_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to update metadata: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_suggest_taxonomy(self, content_id: str) -> Dict:
        """Suggest taxonomy for content."""
        try:
            result = self.content_api.post(
                f"/content/{content_id}/suggest-taxonomy",
                {}
            )
            logger.info(f"Generated taxonomy suggestions for {content_id}")
            return result
        except Exception as e:
            logger.error(f"Taxonomy suggestion failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_system_prompt(self) -> str:
        """Return system prompt for content agent."""
        return """You are the Content Agent. Your responsibilities:
1. Classify content by type (Invoice, Contract, Policy, etc.)
2. Determine sensitivity levels (Public, Internal, Confidential, Restricted)
3. Extract structured metadata (amounts, dates, parties, etc.)
4. Detect and flag personally identifiable information (PII)
5. Suggest taxonomy tags and categorization
6. Update content metadata and classifications

Available tools:
- get_content_item: Retrieve content details
- classify_content: Determine content type and sensitivity
- extract_metadata: Pull structured data from content
- detect_pii: Scan for sensitive personal information
- update_content_metadata: Modify content metadata
- suggest_taxonomy: Generate classification tags

Sensitivity levels:
- PUBLIC: Can be shared openly
- INTERNAL: For internal use only
- CONFIDENTIAL: Restricted access required
- RESTRICTED: Highly sensitive, minimal access

Important:
- Flag all PII findings
- Be conservative with sensitivity levels
- Always log classifications
- Do not modify workflows or policies"""

    def analyze_content_batch(self, content_ids: List[str]) -> Dict[str, Any]:
        """Analyze a batch of content items."""
        logger.info(f"Analyzing batch of {len(content_ids)} content items")

        try:
            results = []
            pii_findings = []

            for content_id in content_ids:
                item_analysis = {
                    "content_id": content_id,
                    "classification": self._tool_classify_content(content_id),
                    "metadata": self._tool_extract_metadata(content_id),
                    "pii_scan": self._tool_detect_pii(content_id)
                }

                results.append(item_analysis)

                # Track PII findings
                pii_result = item_analysis.get("pii_scan", {})
                if pii_result.get("pii_detected"):
                    pii_findings.append({
                        "content_id": content_id,
                        "pii_fields": pii_result.get("fields", [])
                    })

            summary = {
                "items_analyzed": len(content_ids),
                "results": results,
                "pii_findings": pii_findings,
                "recommendations": self._generate_recommendations(results, pii_findings)
            }

            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="batch_analysis",
                target="batch",
                status="success",
                details={"items": len(content_ids), "pii_found": len(pii_findings)}
            )

            return summary
        except Exception as e:
            logger.error(f"Batch analysis failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _generate_recommendations(self, results: List[Dict], pii_findings: List[Dict]) -> List[str]:
        """Generate recommendations based on analysis."""
        recommendations = []

        if pii_findings:
            recommendations.append(
                f"Found PII in {len(pii_findings)} content items - review and redact"
            )

        # Count high sensitivity items
        high_sensitivity = sum(
            1 for r in results
            if r.get("classification", {}).get("sensitivity") in ["CONFIDENTIAL", "RESTRICTED"]
        )
        if high_sensitivity > 0:
            recommendations.append(f"{high_sensitivity} items marked as high sensitivity")

        return recommendations

    def think(self, goal: str) -> str:
        """Process a goal and return reasoning."""
        logger.info(f"Content Agent thinking about: {goal}")
        return f"Analyzing content to: {goal}"

    def act(self, content_ids: List[str]) -> Dict[str, Any]:
        """Execute content analysis."""
        return self.analyze_content_batch(content_ids)
