# CRITICAL Issues and Bug Hunting

## What Works
- Onboarding
- Location services
- Recognizing another person close to you
- Settings
- Convoy connection
- SMS verification

## What Needs to be Fixed
1. **Voice / Audio Connection Failure**:
   - When somebody else enters your vicinity (in proximity mode), the voice doesn't work and there is a sound error on the second device.
   - Convoys: When somebody else joins the convoy, the voice doesn't work.
2. **Remove Camera Feature**:
   - The camera feature needs to be removed from the convoy for now.
3. **Map Initial View/Jump**:
   - When opening up the app, it always goes to a fixed point in New York instead of the current location for the first 2 seconds, which is weird. Fix that.
4. **Proximity Username Visibility and Interactions**:
   - When a user is nearby, it says so but doesn't spell out the username of the user (only user XXXXX).
   - Show their username by default.
   - Implement an "anonymous mode" setting. If anonymous mode is ON, it should hide the username (e.g., show "User XXXXX"). Otherwise, show the actual username.
   - Add a possibility to pin the person and add them as a friend if they pin you back.
5. **Auth Session Persistence**:
   - When closing the app for a while and opening it back, the auth goes back to the beginning and you are logged out. This SHOULD NEVER happen unless you intentionally log out or delete and reinstall the app.
   - The auth should persist between app updates, closing the app, etc.
6. **Friend Search Broken**:
   - Friend search doesn't work; no username can be found.
