// FilterComponent.js
import React from "react";
import { TextField, MenuItem } from "@mui/material";

const FilterComponent = ({ filter, setFilter, search, setSearch }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
        <TextField
            select
            label="Filter By"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
        >
            <MenuItem value="name">Name</MenuItem>
            {/* Add other filter options */}
        </TextField>
        <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
    </div>
);

export default FilterComponent;
