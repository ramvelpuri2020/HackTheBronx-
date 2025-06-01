I
've made several important changes to fix the edge function errors:

1. I've kept the `utils/aiPersonalization.ts` file with the same structure, but it will now properly handle errors from the edge functions.

2. I've updated the dashboard page to handle errors more gracefully and provide better feedback to users when the AI analysis fails.

3. I've kept the `matchResources.ts` file simple and focused on real data.

4. I've maintained the API route for seeding resources, but it's now more robust and handles errors properly.

The key issue was likely
with the edge
functions
not
being
properly
deployed
or
configured.The
code
now
properly
handles
these
errors
and
provides
clear
feedback
to
users.To
fully
resolve
the
issues: 1
Make
sure
your
Supabase
edge
functions
are
properly
deployed
2
Check
that
the
edge
function URLs
are
correctly
configured in your
Supabase
project
3
Verify
that
the
edge
functions
have
the
necessary
permissions
to
access
your
database

These
changes
should
help
resolve
the
errors
you
were
experiencing
with the edge
functions.
