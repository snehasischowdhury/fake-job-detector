from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.database.models import JobAnalysisRecord


class AnalysisRepository:
    """Data-access layer for job analysis records."""

    def create(self, db: Session, record: JobAnalysisRecord) -> JobAnalysisRecord:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get_by_id(self, db: Session, analysis_id: str) -> Optional[JobAnalysisRecord]:
        stmt = select(JobAnalysisRecord).where(JobAnalysisRecord.id == analysis_id)
        return db.execute(stmt).scalar_one_or_none()

    def list_records(
        self,
        db: Session,
        *,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        sort_by: str = "date-desc",
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[JobAnalysisRecord], int]:
        stmt = select(JobAnalysisRecord)
        count_stmt = select(func.count()).select_from(JobAnalysisRecord)

        filters = []
        if search:
            pattern = f"%{search.strip()}%"
            filters.append(
                or_(
                    JobAnalysisRecord.job_title.ilike(pattern),
                    JobAnalysisRecord.company.ilike(pattern),
                )
            )
        if risk_level and risk_level != "ALL":
            filters.append(JobAnalysisRecord.risk_level == risk_level)

        if filters:
            stmt = stmt.where(*filters)
            count_stmt = count_stmt.where(*filters)

        order_map = {
            "date-desc": desc(JobAnalysisRecord.created_at),
            "date-asc": asc(JobAnalysisRecord.created_at),
            "score-desc": desc(JobAnalysisRecord.model_score),
            "score-asc": asc(JobAnalysisRecord.model_score),
        }
        stmt = stmt.order_by(order_map.get(sort_by, desc(JobAnalysisRecord.created_at)))
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        items = list(db.execute(stmt).scalars().all())
        total = int(db.execute(count_stmt).scalar_one())
        return items, total

    def delete_by_id(self, db: Session, analysis_id: str) -> bool:
        record = self.get_by_id(db, analysis_id)
        if record is None:
            return False
        db.delete(record)
        db.commit()
        return True

    def get_statistics(self, db: Session) -> Dict:
        rows = list(
            db.execute(
                select(
                    JobAnalysisRecord.predicted_class,
                    JobAnalysisRecord.risk_level,
                    JobAnalysisRecord.created_at,
                ).order_by(asc(JobAnalysisRecord.created_at))
            ).all()
        )

        total = len(rows)
        fraudulent = sum(1 for row in rows if row.predicted_class == 1)
        legitimate = total - fraudulent

        risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
        daily_trend: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {"legitimate": 0, "flagged": 0}
        )

        for row in rows:
            if row.risk_level in risk_counts:
                risk_counts[row.risk_level] += 1
            day_key = row.created_at.strftime("%Y-%m-%d")
            if row.predicted_class == 1:
                daily_trend[day_key]["flagged"] += 1
            else:
                daily_trend[day_key]["legitimate"] += 1

        return {
            "total_analyzed": total,
            "potentially_fraudulent": fraudulent,
            "legitimate_identified": legitimate,
            "risk_distribution": [
                {"level": "LOW", "count": risk_counts["LOW"]},
                {"level": "MEDIUM", "count": risk_counts["MEDIUM"]},
                {"level": "HIGH", "count": risk_counts["HIGH"]},
            ],
            "recent_trend": [
                {"date": date_str, **counts}
                for date_str, counts in sorted(daily_trend.items())
            ],
        }
