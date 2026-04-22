import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface EventCategoryFormProps {
  eventType: string;
  data: any;
  onChange: (data: any) => void;
}

const EventCategoryForm = ({ eventType, data, onChange }: EventCategoryFormProps) => {
  const updateData = (fieldOrUpdates: string | Record<string, any>, value?: any) => {
    if (typeof fieldOrUpdates === 'string') {
      // Single field update
      onChange({ ...data, [fieldOrUpdates]: value });
    } else {
      // Multiple fields update
      onChange({ ...data, ...fieldOrUpdates });
    }
  };

  // Primary School specific fields
  const renderPrimarySchoolFields = () => (
    <div className="space-y-6">
      {/* Student Information */}
      <div>
        <h4 className="font-semibold mb-3">Student Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="studentName">Student Name *</Label>
            <Input
              id="studentName"
              value={data.studentName || ""}
              onChange={(e) => updateData({ studentName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="grade">Grade *</Label>
            <Select value={data.grade || ""} onValueChange={(value) => updateData({ grade: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kindergarten">Kindergarten</SelectItem>
                <SelectItem value="grade1">Grade 1</SelectItem>
                <SelectItem value="grade2">Grade 2</SelectItem>
                <SelectItem value="grade3">Grade 3</SelectItem>
                <SelectItem value="grade4">Grade 4</SelectItem>
                <SelectItem value="grade5">Grade 5</SelectItem>
                <SelectItem value="grade6">Grade 6</SelectItem>
                <SelectItem value="grade7">Grade 7</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Details */}
      <div>
        <h4 className="font-semibold mb-3">Parent/Guardian Information *</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="guardianName">Full Name *</Label>
            <Input
              id="guardianName"
              value={data.guardianName || ""}
              onChange={(e) => updateData({ guardianName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="guardianPhone">Phone *</Label>
            <Input
              id="guardianPhone"
              type="tel"
              value={data.guardianPhone || ""}
              onChange={(e) => updateData({ guardianPhone: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h4 className="font-semibold mb-3">Emergency Contact *</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyContactName">Full Name *</Label>
            <Input
              id="emergencyContactName"
              value={data.emergencyContactName || ""}
              onChange={(e) => updateData({ emergencyContactName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Phone *</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              value={data.emergencyContactPhone || ""}
              onChange={(e) => updateData({ emergencyContactPhone: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Health & Safety */}
      <div>
        <h4 className="font-semibold mb-3">Health & Safety Information</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="medicalConditions">Medical Conditions</Label>
            <Textarea
              id="medicalConditions"
              placeholder="List any medical conditions staff should be aware of"
              value={data.medicalConditions || ""}
              onChange={(e) => updateData({ medicalConditions: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              placeholder="List any food, environmental, or other allergies"
              value={data.allergies || ""}
              onChange={(e) => updateData({ allergies: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div>
        <h4 className="font-semibold mb-3">Permissions & Consent</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="photoConsent"
              checked={data.photoConsent || false}
              onCheckedChange={(checked) => updateData({ photoConsent: checked })}
            />
            <Label htmlFor="photoConsent" className="font-normal">
              I consent to my child being photographed/filmed during the event
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  // High School specific fields
  const renderHighSchoolFields = () => (
    <div className="space-y-6">
      {/* Student Information */}
      <div>
        <h4 className="font-semibold mb-3">Student Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="studentName">Student Name *</Label>
            <Input
              id="studentName"
              value={data.studentName || ""}
              onChange={(e) => updateData({ studentName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="yearLevel">Year Level *</Label>
            <Select value={data.yearLevel || ""} onValueChange={(value) => updateData({ yearLevel: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year8">Year 8</SelectItem>
                <SelectItem value="year9">Year 9</SelectItem>
                <SelectItem value="year10">Year 10</SelectItem>
                <SelectItem value="year11">Year 11</SelectItem>
                <SelectItem value="year12">Year 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="house">House/Team</Label>
            <Input
              id="house"
              value={data.house || ""}
              onChange={(e) => updateData({ house: e.target.value })}
              placeholder="e.g., Red House, Blue Team"
            />
          </div>
        </div>
      </div>

      {/* Parent/Guardian Contact */}
      <div>
        <h4 className="font-semibold mb-3">Parent/Guardian Contact *</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="guardianName">Full Name *</Label>
            <Input
              id="guardianName"
              value={data.guardianName || ""}
              onChange={(e) => updateData({ guardianName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="guardianPhone">Phone *</Label>
            <Input
              id="guardianPhone"
              type="tel"
              value={data.guardianPhone || ""}
              onChange={(e) => updateData({ guardianPhone: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h4 className="font-semibold mb-3">Emergency Contact *</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emergencyContactName">Full Name *</Label>
            <Input
              id="emergencyContactName"
              value={data.emergencyContactName || ""}
              onChange={(e) => updateData({ emergencyContactName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">Phone *</Label>
            <Input
              id="emergencyContactPhone"
              type="tel"
              value={data.emergencyContactPhone || ""}
              onChange={(e) => updateData({ emergencyContactPhone: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Health & Medical */}
      <div>
        <h4 className="font-semibold mb-3">Health & Medical Information</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="medicalConditions">Medical Conditions</Label>
            <Textarea
              id="medicalConditions"
              placeholder="Any conditions staff should be aware of"
              value={data.medicalConditions || ""}
              onChange={(e) => updateData({ medicalConditions: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              placeholder="Food, environmental, or other allergies"
              value={data.allergies || ""}
              onChange={(e) => updateData({ allergies: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Consents */}
      <div>
        <h4 className="font-semibold mb-3">Parental Consent</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="parentalConsent"
              checked={data.parentalConsent || false}
              onCheckedChange={(checked) => updateData({ parentalConsent: checked })}
            />
            <Label htmlFor="parentalConsent" className="font-normal">
              I give parental consent for my child to participate in this event *
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="photoConsent"
              checked={data.photoConsent || false}
              onCheckedChange={(checked) => updateData({ photoConsent: checked })}
            />
            <Label htmlFor="photoConsent" className="font-normal">
              I consent to photographs/videos being taken
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConcertFields = () => (
    <>
      <div className="space-y-2">
        <Label>Merchandise Bundle</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="merch-tshirt"
              checked={data.merchandise?.tshirt}
              onCheckedChange={(checked) =>
                updateData("merchandise", { ...data.merchandise, tshirt: checked })
              }
            />
            <label htmlFor="merch-tshirt" className="text-sm">Official T-Shirt (+$25)</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="merch-poster"
              checked={data.merchandise?.poster}
              onCheckedChange={(checked) =>
                updateData("merchandise", { ...data.merchandise, poster: checked })
              }
            />
            <label htmlFor="merch-poster" className="text-sm">Signed Poster (+$15)</label>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Parking Pass</Label>
        <RadioGroup
          value={data.parkingPass || "none"}
          onValueChange={(value) => updateData("parkingPass", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="parking-none" />
            <Label htmlFor="parking-none">No Parking</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="standard" id="parking-standard" />
            <Label htmlFor="parking-standard">Standard Parking (+$20)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="vip" id="parking-vip" />
            <Label htmlFor="parking-vip">VIP Parking (+$40)</Label>
          </div>
        </RadioGroup>
      </div>
    </>
  );

  const renderConferenceFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="badge-type">Badge Type</Label>
        <Select value={data.badgeType} onValueChange={(value) => updateData("badgeType", value)}>
          <SelectTrigger id="badge-type">
            <SelectValue placeholder="Select badge type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attendee">Attendee</SelectItem>
            <SelectItem value="speaker">Speaker</SelectItem>
            <SelectItem value="press">Press</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Session Selection</Label>
        <Textarea
          placeholder="List sessions you'd like to attend..."
          value={data.sessions || ""}
          onChange={(e) => updateData("sessions", e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="networking-dinner"
          checked={data.networkingDinner}
          onCheckedChange={(checked) => updateData("networkingDinner", checked)}
        />
        <label htmlFor="networking-dinner" className="text-sm">Add Networking Dinner (+$75)</label>
      </div>
    </>
  );

  const renderSportsFields = () => {
    const sportType = data.sportType || 'soccer';
    
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="sport-type">Sport Type</Label>
          <Select value={sportType} onValueChange={(value) => updateData("sportType", value)}>
            <SelectTrigger id="sport-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soccer">Soccer/Football</SelectItem>
              <SelectItem value="rugby">Rugby</SelectItem>
              <SelectItem value="cricket">Cricket</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="viewing-location">Preferred Viewing Location</Label>
          <Select 
            value={data.viewingLocation || ""} 
            onValueChange={(value) => updateData("viewingLocation", value)}
          >
            <SelectTrigger id="viewing-location">
              <SelectValue placeholder="Select viewing location" />
            </SelectTrigger>
            <SelectContent>
              {sportType === 'soccer' && (
                <>
                  <SelectItem value="behind-goal">Behind Goal (+$20)</SelectItem>
                  <SelectItem value="sideline-center">Sideline Center (+$50)</SelectItem>
                  <SelectItem value="sideline-corner">Sideline Corner (+$30)</SelectItem>
                  <SelectItem value="upper-tier">Upper Tier</SelectItem>
                </>
              )}
              {sportType === 'rugby' && (
                <>
                  <SelectItem value="behind-posts">Behind Posts (+$25)</SelectItem>
                  <SelectItem value="sideline-center">Sideline Center (+$60)</SelectItem>
                  <SelectItem value="corner-sections">Corner Sections (+$35)</SelectItem>
                  <SelectItem value="upper-tier">Upper Tier</SelectItem>
                </>
              )}
              {sportType === 'cricket' && (
                <>
                  <SelectItem value="behind-wickets">Behind Wickets (+$30)</SelectItem>
                  <SelectItem value="mid-wicket">Mid-Wicket Premium (+$70)</SelectItem>
                  <SelectItem value="pavilion">Pavilion (+$55)</SelectItem>
                  <SelectItem value="grass-banks">Grass Banks</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Hospitality Packages</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pre-match-meal"
                checked={data.preMatchMeal || false}
                onCheckedChange={(checked) => updateData("preMatchMeal", checked)}
              />
              <label htmlFor="pre-match-meal" className="text-sm">Pre-Match Meal (+$45)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vip-lounge"
                checked={data.vipLoungeAccess || false}
                onCheckedChange={(checked) => updateData("vipLoungeAccess", checked)}
              />
              <label htmlFor="vip-lounge" className="text-sm">VIP Lounge Access (+$100)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="meet-greet"
                checked={data.meetAndGreet || false}
                onCheckedChange={(checked) => updateData("meetAndGreet", checked)}
              />
              <label htmlFor="meet-greet" className="text-sm">Player Meet & Greet (+$150)</label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="food-voucher">Food & Beverage Vouchers</Label>
          <Select 
            value={data.foodVoucher || "none"} 
            onValueChange={(value) => updateData("foodVoucher", value)}
          >
            <SelectTrigger id="food-voucher">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Voucher</SelectItem>
              <SelectItem value="standard-20">$20 Food Voucher (+$20)</SelectItem>
              <SelectItem value="standard-50">$50 Food Voucher (+$50)</SelectItem>
              <SelectItem value="family-pack">Family Pack - $75 (+$75)</SelectItem>
              <SelectItem value="kids-meal">Kids Meal Deal - $15 (+$15)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parking">Parking Options</Label>
          <Select 
            value={data.parkingOption || "none"} 
            onValueChange={(value) => updateData("parkingOption", value)}
          >
            <SelectTrigger id="parking">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parking</SelectItem>
              <SelectItem value="standard">Standard Parking (+$15)</SelectItem>
              <SelectItem value="premium">Premium Parking (+$30)</SelectItem>
              <SelectItem value="vip">VIP Parking (+$50)</SelectItem>
              <SelectItem value="shuttle">Shuttle Service (+$10)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.parkingOption && data.parkingOption !== 'none' && data.parkingOption !== 'shuttle' && (
          <div className="space-y-2">
            <Label htmlFor="vehicle-reg">Vehicle Registration</Label>
            <Input
              id="vehicle-reg"
              placeholder="Enter vehicle registration number"
              value={data.vehicleRegistration || ""}
              onChange={(e) => updateData("vehicleRegistration", e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Family Ticket Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="family-bundle"
                checked={data.familyBundle || false}
                onCheckedChange={(checked) => updateData("familyBundle", checked)}
              />
              <label htmlFor="family-bundle" className="text-sm">Family Bundle (2 Adults + 2 Kids - Save 15%)</label>
            </div>
            {data.familyBundle && (
              <div className="ml-6 space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="num-adults">Number of Adults (Max 2)</Label>
                  <Input
                    id="num-adults"
                    type="number"
                    min="1"
                    max="2"
                    value={data.numAdults || 2}
                    onChange={(e) => updateData("numAdults", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-kids">Number of Children (Max 3)</Label>
                  <Input
                    id="num-kids"
                    type="number"
                    min="1"
                    max="3"
                    value={data.numKids || 2}
                    onChange={(e) => updateData("numKids", parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team">Favorite Team</Label>
          <Input
            id="team"
            placeholder="Enter your favorite team"
            value={data.favoriteTeam || ""}
            onChange={(e) => updateData("favoriteTeam", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Match Memorabilia</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="match-program"
                checked={data.matchProgram || false}
                onCheckedChange={(checked) => updateData("matchProgram", checked)}
              />
              <label htmlFor="match-program" className="text-sm">Match Program (+$10)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="jersey"
                checked={data.wantsJersey || false}
                onCheckedChange={(checked) => updateData("wantsJersey", checked)}
              />
              <label htmlFor="jersey" className="text-sm">Team Jersey (+$80)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scarf"
                checked={data.wantsScarf || false}
                onCheckedChange={(checked) => updateData("wantsScarf", checked)}
              />
              <label htmlFor="scarf" className="text-sm">Team Scarf (+$25)</label>
            </div>
          </div>
        </div>

        {sportType === 'cricket' && (
          <div className="space-y-2">
            <Label>Cricket-Specific Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multi-day"
                  checked={data.multiDayPass || false}
                  onCheckedChange={(checked) => updateData("multiDayPass", checked)}
                />
                <label htmlFor="multi-day" className="text-sm">Multi-Day Pass (All 5 Days - Save 20%)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sixers-club"
                  checked={data.sixersClub || false}
                  onCheckedChange={(checked) => updateData("sixersClub", checked)}
                />
                <label htmlFor="sixers-club" className="text-sm">Sixers Club Access (+$40)</label>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderFoodFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="dietary">Dietary Restrictions</Label>
        <Select value={data.dietary} onValueChange={(value) => updateData("dietary", value)}>
          <SelectTrigger id="dietary">
            <SelectValue placeholder="Select dietary preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Restrictions</SelectItem>
            <SelectItem value="vegetarian">Vegetarian</SelectItem>
            <SelectItem value="vegan">Vegan</SelectItem>
            <SelectItem value="gluten-free">Gluten-Free</SelectItem>
            <SelectItem value="halal">Halal</SelectItem>
            <SelectItem value="kosher">Kosher</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="allergies">Food Allergies</Label>
        <Input
          id="allergies"
          placeholder="e.g., nuts, shellfish, dairy..."
          value={data.allergies || ""}
          onChange={(e) => updateData("allergies", e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="wine-pairing"
          checked={data.winePairing}
          onCheckedChange={(checked) => updateData("winePairing", checked)}
        />
        <label htmlFor="wine-pairing" className="text-sm">Wine Pairing (+$35)</label>
      </div>
    </>
  );

  const renderKidsFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="age-group">Age Group</Label>
        <Select value={data.ageGroup} onValueChange={(value) => updateData("ageGroup", value)}>
          <SelectTrigger id="age-group">
            <SelectValue placeholder="Select age group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toddler">Toddler (1-3)</SelectItem>
            <SelectItem value="preschool">Preschool (4-5)</SelectItem>
            <SelectItem value="early-elementary">Early Elementary (6-8)</SelectItem>
            <SelectItem value="late-elementary">Late Elementary (9-12)</SelectItem>
            <SelectItem value="teen">Teen (13+)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="photo-package"
          checked={data.photoPackage}
          onCheckedChange={(checked) => updateData("photoPackage", checked)}
        />
        <label htmlFor="photo-package" className="text-sm">Photo Package (+$30)</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="goodie-bag"
          checked={data.goodieBag}
          onCheckedChange={(checked) => updateData("goodieBag", checked)}
        />
        <label htmlFor="goodie-bag" className="text-sm">Goodie Bag (+$15)</label>
      </div>
    </>
  );

  const renderVirtualFields = () => (
    <>
      <div className="space-y-2">
        <Label>Attendance Type</Label>
        <RadioGroup
          value={data.attendanceType || "virtual"}
          onValueChange={(value) => updateData("attendanceType", value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="virtual" id="attend-virtual" />
            <Label htmlFor="attend-virtual">Virtual Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="in-person" id="attend-person" />
            <Label htmlFor="attend-person">In-Person Only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hybrid" id="attend-hybrid" />
            <Label htmlFor="attend-hybrid">Hybrid (Both) (+$20)</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="replay-access"
          checked={data.replayAccess}
          onCheckedChange={(checked) => updateData("replayAccess", checked)}
        />
        <label htmlFor="replay-access" className="text-sm">30-Day Replay Access (+$25)</label>
      </div>
    </>
  );

  const renderDefaultFields = () => (
    <div className="space-y-2">
      <Label htmlFor="special-requests">Special Requests</Label>
      <Textarea
        id="special-requests"
        placeholder="Any special requirements or requests..."
        value={data.specialRequests || ""}
        onChange={(e) => updateData("specialRequests", e.target.value)}
      />
    </div>
  );

  const renderExperiencesFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="experience-type">Experience Type *</Label>
        <Select value={data.experienceType || ""} onValueChange={(v) => updateData("experienceType", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select experience type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tours">Tours</SelectItem>
            <SelectItem value="tastings">Tastings</SelectItem>
            <SelectItem value="classes">Classes & Workshops</SelectItem>
            <SelectItem value="adventures">Adventures</SelectItem>
            <SelectItem value="cultural">Cultural Experiences</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="group-size">Number of Participants</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Adults</Label>
            <Input
              type="number"
              min={1}
              value={data.adults || 1}
              onChange={(e) => updateData("adults", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Children</Label>
            <Input
              type="number"
              min={0}
              value={data.children || 0}
              onChange={(e) => updateData("children", parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Infants</Label>
            <Input
              type="number"
              min={0}
              value={data.infants || 0}
              onChange={(e) => updateData("infants", parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="preferred-language">Preferred Language</Label>
        <Select value={data.preferredLanguage || ""} onValueChange={(v) => updateData("preferredLanguage", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="french">French</SelectItem>
            <SelectItem value="portuguese">Portuguese</SelectItem>
            <SelectItem value="swahili">Swahili</SelectItem>
            <SelectItem value="arabic">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Special Requirements</Label>
        <div className="space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private-experience"
              checked={data.privateExperience || false}
              onCheckedChange={(checked) => updateData("privateExperience", checked)}
            />
            <label htmlFor="private-experience" className="text-sm">Private Experience (+50%)</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pickup-required"
              checked={data.pickupRequired || false}
              onCheckedChange={(checked) => updateData("pickupRequired", checked)}
            />
            <label htmlFor="pickup-required" className="text-sm">Hotel Pickup Needed (+$15)</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="photo-package"
              checked={data.photoPackage || false}
              onCheckedChange={(checked) => updateData("photoPackage", checked)}
            />
            <label htmlFor="photo-package" className="text-sm">Photo Package (+$25)</label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="dietary-restrictions">Dietary Restrictions (if applicable)</Label>
        <Textarea
          id="dietary-restrictions"
          placeholder="Any allergies or dietary requirements..."
          value={data.dietaryRestrictions || ""}
          onChange={(e) => updateData("dietaryRestrictions", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="special-requests">Special Requests</Label>
        <Textarea
          id="special-requests"
          placeholder="Any special requirements or requests..."
          value={data.specialRequests || ""}
          onChange={(e) => updateData("specialRequests", e.target.value)}
        />
      </div>
    </div>
  );

  const renderFields = () => {
    switch (eventType) {
      case "Concert":
      case "Primary School":
        return renderPrimarySchoolFields();
      case "High School":
        return renderHighSchoolFields();
      case "Festival":
        return renderConcertFields();
      case "Conference":
      case "Workshop":
        return renderConferenceFields();
      case "Sports":
        return renderSportsFields();
      case "Food":
        return renderFoodFields();
      case "Kids":
        return renderKidsFields();
      case "Virtual":
        return renderVirtualFields();
      case "Experiences":
        return renderExperiencesFields();
      default:
        return renderDefaultFields();
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Event-Specific Options</h3>
      <div className="space-y-4">{renderFields()}</div>
    </Card>
  );
};

export default EventCategoryForm;
