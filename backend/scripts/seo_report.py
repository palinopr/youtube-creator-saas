#!/usr/bin/env python3

import argparse
import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
]


@dataclass
class EnvConfig:
    oauth_json_path: Path
    oauth_token_path: Path
    ga4_property_id: str
    gsc_property: str


def load_env() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    backend_env = repo_root / "backend" / ".env"
    load_dotenv(backend_env)


def get_env_config() -> EnvConfig:
    oauth_json = os.getenv("SEO_OAUTH_CLIENT_JSON_PATH", "").strip()
    if not oauth_json:
        raise RuntimeError(
            "SEO_OAUTH_CLIENT_JSON_PATH is required. "
            "Download your Desktop OAuth JSON and set this env var."
        )

    oauth_json_path = Path(oauth_json).expanduser()
    if not oauth_json_path.exists():
        raise RuntimeError(f"OAuth JSON not found at {oauth_json_path}")

    repo_root = Path(__file__).resolve().parents[2]
    default_token_dir = repo_root / "backend" / ".cache"
    default_token_dir.mkdir(parents=True, exist_ok=True)
    token_path = Path(os.getenv("SEO_OAUTH_TOKEN_PATH", str(default_token_dir / "seo-token.json"))).expanduser()

    ga4_property_id = os.getenv("GA4_PROPERTY_ID", "").strip()
    gsc_property = os.getenv("GSC_PROPERTY", "").strip()
    if not ga4_property_id:
        raise RuntimeError("GA4_PROPERTY_ID is required for GA4 reporting.")
    if not gsc_property:
        raise RuntimeError("GSC_PROPERTY is required for Search Console reporting.")

    return EnvConfig(
        oauth_json_path=oauth_json_path,
        oauth_token_path=token_path,
        ga4_property_id=ga4_property_id,
        gsc_property=gsc_property,
    )


def get_credentials(oauth_json_path: Path, token_path: Path) -> Credentials:
    creds: Optional[Credentials] = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(oauth_json_path), SCOPES)
            creds = flow.run_local_server(port=0, prompt="consent")
        token_path.parent.mkdir(parents=True, exist_ok=True)
        token_path.write_text(creds.to_json())

    return creds


def _date_range(days: int, end: Optional[date] = None) -> Tuple[str, str]:
    end_date = end or date.today()
    start_date = end_date - timedelta(days=days)
    return start_date.isoformat(), end_date.isoformat()


def _parse_ga4_totals(response: Dict[str, Any], metric_names: List[str]) -> Dict[str, float]:
    totals = response.get("totals", [])
    if not totals:
        return {m: 0.0 for m in metric_names}
    values = totals[0].get("metricValues", [])
    out: Dict[str, float] = {}
    for name, mv in zip(metric_names, values):
        try:
            out[name] = float(mv.get("value", 0))
        except Exception:
            out[name] = 0.0
    return out


def ga4_overview(creds: Credentials, property_id: str, days: int) -> Dict[str, Any]:
    start_date, end_date = _date_range(days)
    metric_names = ["sessions", "activeUsers", "newUsers", "engagedSessions"]

    service = build("analyticsdata", "v1beta", credentials=creds, cache_discovery=False)
    body = {
        "dateRanges": [{"startDate": start_date, "endDate": end_date}],
        "metrics": [{"name": m} for m in metric_names],
    }
    resp = service.properties().runReport(
        property=f"properties/{property_id}", body=body
    ).execute()

    return {
        "startDate": start_date,
        "endDate": end_date,
        "metrics": _parse_ga4_totals(resp, metric_names),
    }


def ga4_channels(creds: Credentials, property_id: str, days: int, limit: int = 10) -> List[Dict[str, Any]]:
    start_date, end_date = _date_range(days)
    service = build("analyticsdata", "v1beta", credentials=creds, cache_discovery=False)
    body = {
        "dateRanges": [{"startDate": start_date, "endDate": end_date}],
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": limit,
    }
    resp = service.properties().runReport(
        property=f"properties/{property_id}", body=body
    ).execute()

    rows = resp.get("rows", []) or []
    out = []
    for r in rows:
        dims = r.get("dimensionValues", [])
        mets = r.get("metricValues", [])
        out.append(
            {
                "channel": dims[0].get("value") if dims else "",
                "sessions": float(mets[0].get("value", 0)) if mets else 0.0,
            }
        )
    return out


def ga4_organic_landing_pages(creds: Credentials, property_id: str, days: int, limit: int = 10) -> List[Dict[str, Any]]:
    start_date, end_date = _date_range(days)
    service = build("analyticsdata", "v1beta", credentials=creds, cache_discovery=False)
    body = {
        "dateRanges": [{"startDate": start_date, "endDate": end_date}],
        "dimensions": [{"name": "landingPagePlusQueryString"}],
        "metrics": [{"name": "sessions"}],
        "dimensionFilter": {
            "filter": {
                "fieldName": "sessionDefaultChannelGroup",
                "stringFilter": {"value": "Organic Search"},
            }
        },
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": limit,
    }
    resp = service.properties().runReport(
        property=f"properties/{property_id}", body=body
    ).execute()

    rows = resp.get("rows", []) or []
    out = []
    for r in rows:
        dims = r.get("dimensionValues", [])
        mets = r.get("metricValues", [])
        out.append(
            {
                "landingPage": dims[0].get("value") if dims else "",
                "sessions": float(mets[0].get("value", 0)) if mets else 0.0,
            }
        )
    return out


def gsc_totals(creds: Credentials, site: str, days: int) -> Dict[str, Any]:
    start_date, end_date = _date_range(days)
    service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    body = {"startDate": start_date, "endDate": end_date, "searchType": "web", "rowLimit": 1}
    resp = service.searchanalytics().query(siteUrl=site, body=body).execute()
    rows = resp.get("rows", []) or []
    if not rows:
        return {"startDate": start_date, "endDate": end_date, "clicks": 0, "impressions": 0, "ctr": 0, "position": 0}
    r = rows[0]
    return {
        "startDate": start_date,
        "endDate": end_date,
        "clicks": r.get("clicks", 0),
        "impressions": r.get("impressions", 0),
        "ctr": r.get("ctr", 0),
        "position": r.get("position", 0),
    }


def gsc_top(creds: Credentials, site: str, days: int, dimension: str, limit: int = 20) -> List[Dict[str, Any]]:
    start_date, end_date = _date_range(days)
    service = build("searchconsole", "v1", credentials=creds, cache_discovery=False)
    body = {
        "startDate": start_date,
        "endDate": end_date,
        "searchType": "web",
        "dimensions": [dimension],
        "rowLimit": limit,
    }
    resp = service.searchanalytics().query(siteUrl=site, body=body).execute()
    rows = resp.get("rows", []) or []
    out = []
    for r in rows:
        keys = r.get("keys", [])
        out.append(
            {
                dimension: keys[0] if keys else "",
                "clicks": r.get("clicks", 0),
                "impressions": r.get("impressions", 0),
                "ctr": r.get("ctr", 0),
                "position": r.get("position", 0),
            }
        )
    return out


def build_report(creds: Credentials, cfg: EnvConfig, ga4_days: int, gsc_days: int) -> Dict[str, Any]:
    ga4 = {
        f"last{ga4_days}d": ga4_overview(creds, cfg.ga4_property_id, ga4_days),
        "channels": ga4_channels(creds, cfg.ga4_property_id, ga4_days),
    }
    try:
        ga4["organicLandingPages"] = ga4_organic_landing_pages(creds, cfg.ga4_property_id, ga4_days)
    except Exception as e:
        ga4["organicLandingPagesError"] = str(e)

    gsc = {
        f"last{gsc_days}d": gsc_totals(creds, cfg.gsc_property, gsc_days),
        "topQueries": gsc_top(creds, cfg.gsc_property, gsc_days, "query"),
        "topPages": gsc_top(creds, cfg.gsc_property, gsc_days, "page"),
    }

    return {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "ga4": ga4,
        "searchConsole": gsc,
    }


def render_markdown(report: Dict[str, Any], ga4_days: int, gsc_days: int) -> str:
    lines = []
    lines.append(f"# TubeGrow SEO Report ({date.today().isoformat()})")
    lines.append("")
    lines.append(f"Generated at: {report['generatedAt']}")
    lines.append("")

    ga4 = report["ga4"]
    ga4_over = ga4.get(f"last{ga4_days}d", {})
    lines.append(f"## GA4 overview (last {ga4_days} days)")
    for k, v in (ga4_over.get("metrics") or {}).items():
        lines.append(f"- **{k}**: {v:,.0f}")
    lines.append("")

    if ga4.get("channels"):
        lines.append("### Sessions by channel")
        for row in ga4["channels"]:
            lines.append(f"- {row['channel']}: {row['sessions']:,.0f}")
        lines.append("")

    if ga4.get("organicLandingPages"):
        lines.append("### Top organic landing pages")
        for row in ga4["organicLandingPages"]:
            lines.append(f"- {row['landingPage']}: {row['sessions']:,.0f} sessions")
        lines.append("")
    if ga4.get("organicLandingPagesError"):
        lines.append(f"_Organic landing pages unavailable: {ga4['organicLandingPagesError']}_")
        lines.append("")

    gsc = report["searchConsole"]
    totals = gsc.get(f"last{gsc_days}d", {})
    lines.append(f"## Search Console (last {gsc_days} days)")
    lines.append(
        f"- **clicks**: {totals.get('clicks',0):,.0f}  |  "
        f"**impressions**: {totals.get('impressions',0):,.0f}  |  "
        f"**ctr**: {totals.get('ctr',0)*100:.2f}%  |  "
        f"**avg position**: {totals.get('position',0):.2f}"
    )
    lines.append("")

    lines.append("### Top queries")
    for row in gsc.get("topQueries", []):
        lines.append(
            f"- {row.get('query','')}: {row.get('clicks',0):,.0f} clicks, "
            f"{row.get('impressions',0):,.0f} impr, "
            f"{row.get('ctr',0)*100:.2f}% CTR, pos {row.get('position',0):.2f}"
        )
    lines.append("")

    lines.append("### Top pages")
    for row in gsc.get("topPages", []):
        lines.append(
            f"- {row.get('page','')}: {row.get('clicks',0):,.0f} clicks, "
            f"{row.get('impressions',0):,.0f} impr, "
            f"{row.get('ctr',0)*100:.2f}% CTR, pos {row.get('position',0):.2f}"
        )
    lines.append("")

    return "\n".join(lines).strip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate TubeGrow GA4 + Search Console SEO report.")
    parser.add_argument("--ga4-days", type=int, default=7, help="Days for GA4 window (default 7).")
    parser.add_argument("--gsc-days", type=int, default=28, help="Days for Search Console window (default 28).")
    parser.add_argument("--json", action="store_true", help="Output raw JSON instead of markdown.")
    parser.add_argument("--out", type=str, default="", help="Optional file path to write report.")
    args = parser.parse_args()

    load_env()
    cfg = get_env_config()
    creds = get_credentials(cfg.oauth_json_path, cfg.oauth_token_path)

    report = build_report(creds, cfg, args.ga4_days, args.gsc_days)
    output = json.dumps(report, indent=2) if args.json else render_markdown(report, args.ga4_days, args.gsc_days)

    if args.out:
        out_path = Path(args.out).expanduser()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output)
    else:
        print(output)


if __name__ == "__main__":
    main()

