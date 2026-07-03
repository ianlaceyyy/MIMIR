"""U.S. state / territory reference: FIPS code, USPS abbreviation, name.

Source of truth for seeding the `State` table and for constructing congressional
district GEOIDs (state FIPS + 2-digit district). FIPS codes are from the U.S. Census
Bureau ANSI/FIPS standard.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class StateRef:
    fips: str
    abbr: str
    name: str


# 50 states + DC + the five territories that send delegates to Congress.
STATES: list[StateRef] = [
    StateRef("01", "AL", "Alabama"),
    StateRef("02", "AK", "Alaska"),
    StateRef("04", "AZ", "Arizona"),
    StateRef("05", "AR", "Arkansas"),
    StateRef("06", "CA", "California"),
    StateRef("08", "CO", "Colorado"),
    StateRef("09", "CT", "Connecticut"),
    StateRef("10", "DE", "Delaware"),
    StateRef("11", "DC", "District of Columbia"),
    StateRef("12", "FL", "Florida"),
    StateRef("13", "GA", "Georgia"),
    StateRef("15", "HI", "Hawaii"),
    StateRef("16", "ID", "Idaho"),
    StateRef("17", "IL", "Illinois"),
    StateRef("18", "IN", "Indiana"),
    StateRef("19", "IA", "Iowa"),
    StateRef("20", "KS", "Kansas"),
    StateRef("21", "KY", "Kentucky"),
    StateRef("22", "LA", "Louisiana"),
    StateRef("23", "ME", "Maine"),
    StateRef("24", "MD", "Maryland"),
    StateRef("25", "MA", "Massachusetts"),
    StateRef("26", "MI", "Michigan"),
    StateRef("27", "MN", "Minnesota"),
    StateRef("28", "MS", "Mississippi"),
    StateRef("29", "MO", "Missouri"),
    StateRef("30", "MT", "Montana"),
    StateRef("31", "NE", "Nebraska"),
    StateRef("32", "NV", "Nevada"),
    StateRef("33", "NH", "New Hampshire"),
    StateRef("34", "NJ", "New Jersey"),
    StateRef("35", "NM", "New Mexico"),
    StateRef("36", "NY", "New York"),
    StateRef("37", "NC", "North Carolina"),
    StateRef("38", "ND", "North Dakota"),
    StateRef("39", "OH", "Ohio"),
    StateRef("40", "OK", "Oklahoma"),
    StateRef("41", "OR", "Oregon"),
    StateRef("42", "PA", "Pennsylvania"),
    StateRef("44", "RI", "Rhode Island"),
    StateRef("45", "SC", "South Carolina"),
    StateRef("46", "SD", "South Dakota"),
    StateRef("47", "TN", "Tennessee"),
    StateRef("48", "TX", "Texas"),
    StateRef("49", "UT", "Utah"),
    StateRef("50", "VT", "Vermont"),
    StateRef("51", "VA", "Virginia"),
    StateRef("53", "WA", "Washington"),
    StateRef("54", "WV", "West Virginia"),
    StateRef("55", "WI", "Wisconsin"),
    StateRef("56", "WY", "Wyoming"),
    StateRef("60", "AS", "American Samoa"),
    StateRef("66", "GU", "Guam"),
    StateRef("69", "MP", "Northern Mariana Islands"),
    StateRef("72", "PR", "Puerto Rico"),
    StateRef("78", "VI", "U.S. Virgin Islands"),
]

BY_ABBR: dict[str, StateRef] = {s.abbr: s for s in STATES}
BY_FIPS: dict[str, StateRef] = {s.fips: s for s in STATES}


def district_geoid(state_abbr: str, district_number: int) -> str:
    """Census congressional-district GEOID = state FIPS + 2-digit district.

    At-large districts use "00" per Census convention.
    """
    fips = BY_ABBR[state_abbr.upper()].fips
    return f"{fips}{district_number:02d}"
