from datetime import date, timedelta

from app.product_features import (
    _resolve_roadmap_schedule,
    build_roadmap,
    build_weekly_drills,
)


def test_resolve_roadmap_schedule_without_date():
    target, days_left = _resolve_roadmap_schedule(date.today(), "")
    assert target is None
    assert days_left == 0


def test_resolve_roadmap_schedule_short_window():
    target, days_left = _resolve_roadmap_schedule(date.today(), str(date.today() + timedelta(days=4)))
    assert target == date.today() + timedelta(days=4)
    assert days_left == 4


def test_roadmap_uses_focus_specific_templates():
    technical = build_roadmap(
        profession="Backend Developer",
        target_company="Trendyol",
        interview_date=str(date.today() + timedelta(days=7)),
        focus_area="Technical",
    )
    behavioral = build_roadmap(
        profession="Backend Developer",
        target_company="Trendyol",
        interview_date=str(date.today() + timedelta(days=7)),
        focus_area="Behavioral",
    )

    assert technical["focus_area"] == "Technical"
    assert behavioral["focus_area"] == "Behavioral"
    assert technical["days_left"] == 7
    assert technical["schedule"][0]["title"] != behavioral["schedule"][0]["title"]
    assert any("Trendyol" in day["detail"] for day in technical["schedule"])


def test_roadmap_interview_today_is_one_day_plan():
    roadmap = build_roadmap(
        profession="Software Engineer",
        target_company="Google",
        interview_date=str(date.today()),
        focus_area="Mixed",
    )
    assert roadmap["days_left"] == 1


def test_roadmap_without_date_returns_empty_schedule():
    roadmap = build_roadmap(
        profession="Software Engineer",
        target_company="Google",
        interview_date="",
        focus_area="Mixed",
    )
    assert roadmap["days_left"] == 0
    assert roadmap["schedule"] == []
    assert roadmap["interview_date"] == ""


def test_weekly_drills_follow_focus_area():
    drills = build_weekly_drills(
        profession="AI Engineer",
        target_company="Google",
        interview_date=str(date.today() + timedelta(days=14)),
        focus_area="Technical",
    )
    assert drills["focus_area"] == "Technical"
    assert drills["drills"][0]["title"] == "Technical Depth Sprint"
