import os
import re
import json
import glob
from html import unescape

def clean_text(text):
    if not text:
        return ""
    text = unescape(text)
    # replace non-ascii punctuation like quotes/dashes cleanly if needed
    text = text.replace('\xa0', ' ').replace('', ' - ')
    return text.strip()

def main():
    print("Starting data extraction...")
    desktop_files = glob.glob(r"C:\Users\Sri Harsha\OneDrive\Desktop\*.html")
    if not desktop_files:
        print("Legacy HTML file not found!")
        return
    
    html_path = desktop_files[0]
    print(f"Reading HTML file from {html_path}...")
    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    print("Extracting Specializations...")
    specializations = []
    # Pattern: <section class="specsec" id="spsec-sp47" data-spec="SP47"><button class="specsec-h" style="--sc:#7C3AED" ... <h3>5G...</h3> ... <span class="sn">31</span>
    spec_matches = re.findall(
        r'<section[^>]*class="specsec"[^>]*data-spec="([^"]+)"[^>]*>.*?style="([^"]*)"[^>]*>.*?<h3[^>]*>(.*?)</h3>.*?<span class="sn">(\d+)</span>',
        content,
        re.DOTALL
    )

    spec_map = {}
    for spec_id, style_str, h3_text, sn_count in spec_matches:
        color_m = re.search(r'--sc:\s*(#[0-9A-Fa-f]+)', style_str)
        color = color_m.group(1) if color_m else "#3B82F6"
        clean_name = re.sub(r'^\d+\.\s*', '', clean_text(h3_text)).strip()
        spec_data = {
            "id": spec_id,
            "name": clean_name,
            "color": color,
            "projectCount": int(sn_count)
        }
        specializations.append(spec_data)
        spec_map[spec_id] = spec_data

    print(f"Extracted {len(specializations)} specializations.")

    print("Extracting Projects...")
    projects = []
    # Pattern for cards
    card_matches = re.finditer(r'<div[^>]*class="card"[^>]*data-uc="([^"]+)"(.*?)</div>\s*</div>', content, re.DOTALL)
    
    for match in card_matches:
        uc_id = match.group(1)
        card_inner = match.group(2)
        
        # Color styles
        style_m = re.search(r'style="([^"]*)"', match.group(0))
        style_str = style_m.group(1) if style_m else ""
        sc_m = re.search(r'--sc:\s*(#[0-9A-Fa-f]+)', style_str)
        ic_m = re.search(r'--ic:\s*(#[0-9A-Fa-f]+)', style_str)
        sc_color = sc_m.group(1) if sc_m else "#3B82F6"
        ic_color = ic_m.group(1) if ic_m else "#F59E0B"

        dom_pill = re.search(r'<span class="dominant-pill">(.*?)</span>', card_inner)
        imp_pill = re.search(r'<span class="impact-pill">(.*?)</span>', card_inner)
        qual_pill = re.search(r'<span class="quality-pill">(.*?)</span>', card_inner)
        title_m = re.search(r'<h4[^>]*>(.*?)</h4>', card_inner)
        cdesc_m = re.search(r'<p class="cdesc">(.*?)</p>', card_inner, re.DOTALL)
        org_m = re.search(r'<div class="orgline"><b>Problem issuer / upstream custodian</b><span>(.*?)</span></div>', card_inner)
        venue_m = re.search(r'<div class="venue-line">(.*?)</div>', card_inner, re.DOTALL)
        tags_m = re.findall(r'<span class="minitag"[^>]*style="([^"]*)"[^>]*>(.*?)</span>', card_inner)

        dominant_spec = clean_text(dom_pill.group(1)) if dom_pill else ""
        impact_pill_val = clean_text(imp_pill.group(1)) if imp_pill else "Industry Impact"
        quality_pattern = clean_text(qual_pill.group(1)) if qual_pill else ""
        title = clean_text(title_m.group(1)) if title_m else ""
        
        raw_cdesc = cdesc_m.group(1) if cdesc_m else ""
        raw_cdesc = clean_text(raw_cdesc)
        
        # Parse mandate, problem context, consequence
        mandate = ""
        problem_context = ""
        consequence = ""
        
        if "Project mandate:" in raw_cdesc:
            parts = raw_cdesc.split("Problem context and prescribed solution direction:")
            mandate_part = parts[0].replace("Project mandate:", "").strip()
            mandate = mandate_part
            if len(parts) > 1:
                prob_part = parts[1].strip()
                if "The consequence is" in prob_part:
                    prob_sub, cons_sub = prob_part.split("The consequence is", 1)
                    problem_context = prob_sub.strip()
                    consequence = "The consequence is " + cons_sub.strip()
                else:
                    problem_context = prob_part
        else:
            problem_context = raw_cdesc

        custodian = clean_text(org_m.group(1)) if org_m else "KL University Capstone Office"

        # Parse venue line (source platform, custodian sector, app sector, related specs)
        venue_text = clean_text(venue_m.group(1)) if venue_m else ""
        source_platform = "Internal"
        custodian_sector = "Education & Research"
        app_sector = "Engineering Systems"
        related_specs = []

        if "Source platform / publisher:" in venue_text:
            source_match = re.search(r'Source platform / publisher:\s*<b>?(.*?)</b>?\s*•', venue_text)
            if source_match:
                source_platform = source_match.group(1).strip()
        
        if "Issuer / custodian sector:" in venue_text:
            sector_match = re.search(r'Issuer / custodian sector:\s*<b>?(.*?)</b>?\s*•', venue_text)
            if not sector_match:
                sector_match = re.search(r'Issuer / custodian sector:\s*(.*)', venue_text)
            if sector_match:
                custodian_sector = sector_match.group(1).split("•")[0].strip()

        if "Application sector focus:" in venue_text:
            app_match = re.search(r'Application sector focus:\s*<b>?(.*?)</b>?\s*•', venue_text)
            if app_match:
                app_sector = app_match.group(1).strip()

        if "Related specialization" in venue_text:
            rel_match = re.search(r'Related specialization[s]?:\s*(.*)', venue_text)
            if rel_match:
                rel_str = rel_match.group(1).strip()
                related_specs = [s.strip() for s in rel_str.split(",") if s.strip()]

        tech_tags = []
        for tag_style, tag_name in tags_m:
            clean_tag_name = clean_text(tag_name)
            bg_match = re.search(r'background:\s*(#[0-9A-Fa-f]+)', tag_style)
            tag_bg = bg_match.group(1) if bg_match else "#475569"
            tech_tags.append({
                "name": clean_tag_name,
                "color": tag_bg
            })

        project_obj = {
            "id": uc_id,
            "title": title,
            "mandate": mandate,
            "problemContext": problem_context,
            "consequenceStatement": consequence,
            "dominantSpecialization": dominant_spec,
            "relatedSpecializations": related_specs,
            "impactTag": impact_pill_val,
            "qualityPattern": quality_pattern,
            "custodian": custodian,
            "custodianSector": custodian_sector,
            "sourcePlatform": source_platform,
            "applicationSector": app_sector,
            "techTags": tech_tags,
            "scColor": sc_color,
            "icColor": ic_color
        }
        projects.append(project_obj)

    print(f"Extracted {len(projects)} total project records.")

    # Create destination output directory
    output_dir = os.path.join("d:\\CAPSTONE-PROJECT", "src", "data")
    os.makedirs(output_dir, exist_ok=True)

    projects_json_path = os.path.join(output_dir, "projects.json")
    with open(projects_json_path, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2)
    print(f"Saved projects to {projects_json_path}")

    specs_json_path = os.path.join(output_dir, "specializations.json")
    with open(specs_json_path, "w", encoding="utf-8") as f:
        json.dump(specializations, f, indent=2)
    print(f"Saved specializations to {specs_json_path}")

    # Generate insights summary
    sector_counts = {}
    custodian_counts = {}
    impact_counts = {}
    tag_counts = {}

    for p in projects:
        sec = p["applicationSector"] or "General Engineering"
        sector_counts[sec] = sector_counts.get(sec, 0) + 1

        cust = p["custodian"] or "KL University"
        custodian_counts[cust] = custodian_counts.get(cust, 0) + 1

        imp = p["impactTag"] or "Industry Impact"
        impact_counts[imp] = impact_counts.get(imp, 0) + 1

        for t in p["techTags"]:
            t_name = t["name"]
            tag_counts[t_name] = tag_counts.get(t_name, 0) + 1

    insights = {
        "totalProjects": len(projects),
        "totalSpecializations": len(specializations),
        "sectorCounts": sector_counts,
        "custodianCounts": dict(sorted(custodian_counts.items(), key=lambda x: x[1], reverse=True)[:15]),
        "impactCounts": impact_counts,
        "topTechTags": dict(sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:25])
    }

    insights_json_path = os.path.join(output_dir, "insights.json")
    with open(insights_json_path, "w", encoding="utf-8") as f:
        json.dump(insights, f, indent=2)
    print(f"Saved insights summary to {insights_json_path}")
    print("Data extraction complete!")

if __name__ == "__main__":
    main()
