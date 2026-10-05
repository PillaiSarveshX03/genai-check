import sys
import os
import json
import math
from datetime import datetime, timezone, timedelta

# Add orbital-engine to path to use existing propagation
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(project_root, "orbital-engine"))

from src.propagation.sgp4_engine import initialize_satellite, propagate_satellite, get_orbital_parameters

def norm(v):
    return math.sqrt(v[0]**2 + v[1]**2 + v[2]**2)

def calculate_tca():
    input_path = os.path.join(project_root, "orbital-engine", "output", "satellites.json")
    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        return

    with open(input_path, 'r') as f:
        satellites_data = json.load(f)

    # Initialize all satellites
    sats = []
    for sat in satellites_data:
        try:
            satrec = initialize_satellite(sat["tle"][0], sat["tle"][1])
            sats.append({
                "id": sat["id"],
                "name": sat["name"],
                "satrec": satrec,
                "data": sat
            })
        except Exception as e:
            continue

    if len(sats) < 2:
        print("Not enough satellites to compute TCA.")
        return

    current_time = datetime.now(timezone.utc)
    # limit to 20 satellites for speed in this example
    sats = sats[:20] 

    events = []
    
    print(f"Calculating TCA for {len(sats)} satellites over 24 hours...")

    # For every pair, find minimum distance
    for i in range(len(sats)):
        for j in range(i + 1, len(sats)):
            satA = sats[i]
            satB = sats[j]
            
            min_dist = float('inf')
            tca_time = None
            tca_rA, tca_rB = None, None
            tca_vA, tca_vB = None, None
            
            # Coarse search: 5 minute steps for 24 hours
            step_min = 5
            for k in range(0, 24 * 60, step_min):
                t = current_time + timedelta(minutes=k)
                rA, vA = propagate_satellite(satA["satrec"], t)
                rB, vB = propagate_satellite(satB["satrec"], t)
                
                if rA and rB:
                    dist = math.sqrt((rA[0]-rB[0])**2 + (rA[1]-rB[1])**2 + (rA[2]-rB[2])**2)
                    if dist < min_dist:
                        min_dist = dist
                        tca_time = t

            # If coarse distance < 2000 km, refine search to 10 seconds
            if tca_time and min_dist < 2000:
                refined_min_dist = float('inf')
                refined_tca = None
                r_rA, r_rB = None, None
                r_vA, r_vB = None, None
                
                for k in range(-step_min * 60, step_min * 60, 10):
                    t = tca_time + timedelta(seconds=k)
                    rA, vA = propagate_satellite(satA["satrec"], t)
                    rB, vB = propagate_satellite(satB["satrec"], t)
                    
                    if rA and rB:
                        dist = math.sqrt((rA[0]-rB[0])**2 + (rA[1]-rB[1])**2 + (rA[2]-rB[2])**2)
                        if dist < refined_min_dist:
                            refined_min_dist = dist
                            refined_tca = t
                            r_rA, r_rB = rA, rB
                            r_vA, r_vB = vA, vB
                
                if refined_tca and refined_min_dist <= 150:
                    # Found a close approach <= 150 km
                    # Calculate required parameters for simulation
                    velA = norm(r_vA)
                    velB = norm(r_vB)
                    
                    # Relative velocity
                    rel_vx = r_vA[0] - r_vB[0]
                    rel_vy = r_vA[1] - r_vB[1]
                    rel_vz = r_vA[2] - r_vB[2]
                    rel_vel = norm([rel_vx, rel_vy, rel_vz])
                    
                    if rel_vel < 0.001:
                        continue # Skip identical orbits/satellites
                    
                    # Inclination from satrec
                    incA = math.degrees(satA["satrec"].inclo)
                    incB = math.degrees(satB["satrec"].inclo)
                    
                    # Determine retrograde visually (opposite direction)
                    # We can use the dot product of velocities
                    dot_v = (r_vA[0]*r_vB[0] + r_vA[1]*r_vB[1] + r_vA[2]*r_vB[2]) / (velA * velB)
                    retroB = bool(dot_v < 0)
                    
                    _, perA, _ = get_orbital_parameters(satA["satrec"])
                    _, perB, _ = get_orbital_parameters(satB["satrec"])
                    
                    # format time to match simulation: YYYY-MM-DD HH:MM:SS
                    tca_str = refined_tca.strftime("%Y-%m-%d %H:%M:%S")
                    
                    # determine risk
                    risk = "low"
                    if refined_min_dist < 10:
                        risk = "high"
                    elif refined_min_dist < 50:
                        risk = "watch"

                    events.append({
                        "a": satA["name"],
                        "b": satB["name"],
                        "typeA": "Object",
                        "typeB": "Object",
                        "altA": perA,
                        "altB": perB,
                        "velA": velA,
                        "velB": velB,
                        "vel": rel_vel,
                        "incA": incA,
                        "incB": incB,
                        "retroB": retroB,
                        "miss": refined_min_dist * 1000, # Convert to meters
                        "sig": refined_min_dist * 50, # Dummy covariance size
                        "pc": [1.0, -6], # Dummy Probability
                        "tca": tca_str,
                        "when": "in " + str(int((refined_tca - current_time).total_seconds() / 3600)) + " h",
                        "risk": risk,
                        "geometry": "Close approach"
                    })

    # Sort by TCA miss distance
    events = sorted(events, key=lambda x: x["miss"])
    
    output_path = os.path.join(project_root, "src", "data", "tca_events.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(events, f, indent=2)
        
    print(f"Generated {len(events)} TCA events. Saved to {output_path}")

if __name__ == "__main__":
    calculate_tca()
