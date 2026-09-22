import os
import re
from pathlib import Path

REPO_ROOT = Path(r"e:\SIH\SIH Demo with Audit and research")
AGENCY_DIR = REPO_ROOT / ".agency-agents"
DEST_SKILLS_DIR = REPO_ROOT / ".agents" / "skills"
BRAIN_AGENTS_DIR = REPO_ROOT / "brain" / "agency-agents"

CATEGORIES = [
    "academic", "design", "engineering", "finance", "game-development",
    "gis", "healthcare", "integrations", "marketing", "paid-media",
    "product", "project-management", "research", "sales", "security",
    "spatial-computing", "specialized", "strategy", "support", "testing"
]

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

def parse_agent_file(file_path: Path):
    content = file_path.read_text(encoding="utf-8")
    
    name = file_path.stem
    desc = ""
    body = content
    
    # Check for frontmatter
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            body = parts[2].strip()
            
            # Simple regex parse for name & description
            name_match = re.search(r"^name:\s*['\"]?(.*?)['\"]?\s*$", fm_text, re.MULTILINE)
            if name_match:
                name = name_match.group(1).strip()
                
            desc_match = re.search(r"^description:\s*(?:>|\|)?\s*\n?(.*?)(?=\n[a-z_-]+:|$)", fm_text, re.MULTILINE | re.DOTALL)
            if desc_match:
                desc = desc_match.group(1).replace("\n", " ").strip()
            else:
                desc_line = re.search(r"^description:\s*['\"]?(.*?)['\"]?\s*$", fm_text, re.MULTILINE)
                if desc_line:
                    desc = desc_line.group(1).strip()
                    
            return name, desc, body
            
    # Fallback: extract title from markdown headers
    for line in content.splitlines():
        if line.startswith("# "):
            name = line.replace("# ", "").strip()
            break
            
    return name, desc, body

def install_agents():
    DEST_SKILLS_DIR.mkdir(parents=True, exist_ok=True)
    BRAIN_AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    
    count = 0
    catalog = []
    
    for category in CATEGORIES:
        cat_dir = AGENCY_DIR / category
        if not cat_dir.is_dir():
            continue
            
        for agent_file in sorted(cat_dir.glob("*.md")):
            if agent_file.name.startswith("README"):
                continue
                
            name, desc, body = parse_agent_file(agent_file)
            slug = f"agency-{slugify(name)}"
            
            # 1. Install as Antigravity Workspace Skill in .agents/skills/{slug}/SKILL.md
            skill_dir = DEST_SKILLS_DIR / slug
            skill_dir.mkdir(parents=True, exist_ok=True)
            skill_file = skill_dir / "SKILL.md"
            
            safe_desc = desc if desc else f"Agency Agent: {name} specialist for {category}"
            safe_desc = safe_desc.replace("'", "''").strip()
            
            skill_content = f"---\nname: '{slug}'\ndescription: >\n  {safe_desc}\n---\n\n{body}\n"
            skill_file.write_text(skill_content, encoding="utf-8")
            
            # 2. Also keep a categorized copy in brain/agency-agents/{category}/{agent_file.name}
            brain_cat_dir = BRAIN_AGENTS_DIR / category
            brain_cat_dir.mkdir(parents=True, exist_ok=True)
            (brain_cat_dir / agent_file.name).write_text(agent_file.read_text(encoding="utf-8"), encoding="utf-8")
            
            catalog.append({
                "name": name,
                "slug": slug,
                "category": category,
                "description": safe_desc,
                "file": str(agent_file.relative_to(REPO_ROOT))
            })
            count += 1

    # Write a master ROSTER.md inside brain/agency-agents/
    roster_md = "# 🎭 The Agency — Installed AI Specialists Roster\n\n"
    roster_md += f"**Total Specialists Installed**: {count} agents across {len(CATEGORIES)} divisions.\n\n"
    
    by_category = {}
    for item in catalog:
        by_category.setdefault(item['category'], []).append(item)
        
    for cat, items in by_category.items():
        roster_md += f"## 📁 {cat.capitalize()} Division ({len(items)} Agents)\n\n"
        roster_md += "| Agent Name | Antigravity Skill ID | Specialty / Focus |\n"
        roster_md += "|---|---|---|\n"
        for it in items:
            short_desc = it['description'][:100] + ("..." if len(it['description']) > 100 else "")
            roster_md += f"| **{it['name']}** | `{it['slug']}` | {short_desc} |\n"
        roster_md += "\n"
        
    (BRAIN_AGENTS_DIR / "ROSTER.md").write_text(roster_md, encoding="utf-8")
    print(f"Successfully installed {count} agency agents into {DEST_SKILLS_DIR} and {BRAIN_AGENTS_DIR}")

if __name__ == "__main__":
    install_agents()
