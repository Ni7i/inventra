using FluentAssertions;
using Inventra.Api.Auth;

namespace Inventra.Api.Tests;

public class PasswordHasherTests
{
    private readonly BCryptPasswordHasher _hasher = new();

    [Fact]
    public void Hash_produces_verifiable_hash()
    {
        var hash = _hasher.Hash("Correct-Horse-42");
        _hasher.Verify("Correct-Horse-42", hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_rejects_wrong_password()
    {
        var hash = _hasher.Hash("Correct-Horse-42");
        _hasher.Verify("wrong", hash).Should().BeFalse();
    }

    [Fact]
    public void Two_hashes_of_same_password_differ()
    {
        var a = _hasher.Hash("same");
        var b = _hasher.Hash("same");
        a.Should().NotBe(b);
    }
}
