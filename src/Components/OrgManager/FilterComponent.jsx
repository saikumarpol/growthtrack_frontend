// FilterComponent.jsx
import React from "react";
import { TextField, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { useTranslation } from "react-i18next";

const FilterComponent = ({ filter, setFilter, search, setSearch }) => {
  const { t } = useTranslation();

  return (
    <div
      className="input-group col-8"
      style={{
        padding: "5px",
        alignItems: "center",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <FormControl variant="outlined" style={{ minWidth: 100, marginRight: "4px" }}>
        <InputLabel>{t("Filter_By")}</InputLabel>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          label={t("Filter_By")}
        >
          <MenuItem value="name">{t("Name")}</MenuItem>
          <MenuItem value="phone">{t("Phone")}</MenuItem>
          <MenuItem value="email">{t("Email")}</MenuItem>
          <MenuItem value="district">{t("District")}</MenuItem>
          <MenuItem value="state">{t("State")}</MenuItem>
        </Select>
      </FormControl>
      <TextField
        variant="outlined"
        placeholder={t("Search")}
        onChange={(e) => setSearch(e.target.value)}
        style={{ fontSize: "18px", minWidth: "275px", minHeight: "20px" }}
      />
    </div>
  );
};

export default FilterComponent;
