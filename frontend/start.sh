#!/bin/bash
exec 2> >(grep -v "Failed to find Server Action" >&2)
exec next start -p 3000
